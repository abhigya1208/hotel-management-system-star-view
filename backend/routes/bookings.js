const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { protect, authorize, logAction } = require('../middleware/auth');

const isSameDay = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
};

const isYesterday = (date) => {
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date);
  return d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();
};

// Get bookings with filters
router.get('/', protect, async (req, res) => {
  try {
    const { date, startDate, endDate, status, roomId, page = 1, limit = 50 } = req.query;
    let query = {};

    if (req.user.role === 'manager') {
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      query.bookingDate = { $gte: yesterday, $lt: tomorrow };
    } else if (date) {
      const d = new Date(date); d.setHours(0,0,0,0);
      const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1);
      query.bookingDate = { $gte: d, $lt: nextD };
    } else if (startDate && endDate) {
      query.bookingDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (status) query.status = status;
    if (roomId) query.room = roomId;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('room', 'roomNumber roomType')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: bookings, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single booking
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room').populate('createdBy', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Search guests by phone (autocomplete)
router.get('/search/guest', protect, async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone || phone.length < 5) return res.json({ success: true, data: [] });
    const bookings = await Booking.find({ 'guests.phone': { $regex: phone, $options: 'i' } })
      .select('guests roomNumber bookingDate')
      .limit(5)
      .sort({ createdAt: -1 });
    const guests = [];
    bookings.forEach(b => b.guests.forEach(g => { if (g.phone?.includes(phone)) guests.push({ ...g.toObject(), bookingId: b.bookingId, bookingDate: b.bookingDate }); }));
    res.json({ success: true, data: guests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create booking
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { room: roomId } = req.body;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    // Check for web bookings on this room for today
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const existingWebBooking = await Booking.findOne({ room: roomId, isWebBooking: true, status: 'webBooking', bookingDate: { $gte: today, $lt: tomorrow } });
    
    const booking = await Booking.create({ ...req.body, roomNumber: room.roomNumber, createdBy: req.user._id });
    
    // Check repeat customer
    if (req.body.guests?.[0]?.phone) {
      const prev = await Booking.countDocuments({ 'guests.phone': req.body.guests[0].phone, _id: { $ne: booking._id } });
      if (prev > 0) await Booking.findByIdAndUpdate(booking._id, { isRepeatCustomer: true });
    }

    await logAction(req, 'CREATE_BOOKING', 'booking', `Booking ${booking.bookingId} created for room ${room.roomNumber}`, { bookingId: booking._id });
    res.status(201).json({ success: true, data: booking, webBookingConflict: !!existingWebBooking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Check-in
router.put('/:id/checkin', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    booking.status = 'checkedIn';
    booking.checkIn = new Date();
    booking.updatedBy = req.user._id;
    await booking.save();
    await Room.findByIdAndUpdate(booking.room, { status: 'occupied' });
    await logAction(req, 'CHECK_IN', 'booking', `Check-in for booking ${booking.bookingId}`, { bookingId: booking._id });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Check-out
router.put('/:id/checkout', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    booking.status = 'checkedOut';
    booking.checkOut = new Date();
    booking.updatedBy = req.user._id;
    if (req.body.paidAmount !== undefined) booking.paidAmount = req.body.paidAmount;
    booking.remainingAmount = booking.totalAmount - booking.paidAmount;
    await booking.save();
    await Room.findByIdAndUpdate(booking.room, { status: 'ready' });
    await logAction(req, 'CHECK_OUT', 'booking', `Check-out for booking ${booking.bookingId}`, { bookingId: booking._id });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update booking
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    // Manager can only edit same day
    if (req.user.role === 'manager' && !isSameDay(booking.bookingDate)) {
      return res.status(403).json({ success: false, message: 'Managers can only edit bookings created today' });
    }
    const updated = await Booking.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    await logAction(req, 'UPDATE_BOOKING', 'booking', `Updated booking ${booking.bookingId}`, { bookingId: booking._id });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Cancel booking
router.put('/:id/cancel', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled', updatedBy: req.user._id }, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    await Room.findByIdAndUpdate(booking.room, { status: 'vacant' });
    await logAction(req, 'CANCEL_BOOKING', 'booking', `Cancelled booking ${booking.bookingId}`, { bookingId: booking._id });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mark web booking alert as read
router.put('/:id/alert-read', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    await Booking.findByIdAndUpdate(req.params.id, { isAlerRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
