const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Pricing = require('../models/Pricing');
const Log = require('../models/Log');

// Get available rooms for public
router.get('/rooms', async (req, res) => {
  try {
    const { date } = req.query;
    const checkDate = date ? new Date(date) : new Date();
    checkDate.setHours(0,0,0,0);
    const nextDay = new Date(checkDate); nextDay.setDate(nextDay.getDate() + 1);

    const rooms = await Room.find({ active: true, status: { $ne: 'maintenance' } });
    const bookedRoomIds = await Booking.find({
      bookingDate: { $gte: checkDate, $lt: nextDay },
      status: { $in: ['confirmed', 'checkedIn', 'webBooking'] }
    }).distinct('room');

    const pricing = await Pricing.find();
    const priceMap = {};
    pricing.forEach(p => priceMap[p.roomType] = p.price);

    const available = rooms.map(r => ({
      _id: r._id,
      roomNumber: r.roomNumber,
      roomType: r.roomType,
      floor: r.floor,
      description: r.description,
      status: r.status,
      price: priceMap[r.roomType] || r.basePrice,
      isAvailable: !bookedRoomIds.some(id => id.toString() === r._id.toString()) && r.status !== 'occupied'
    }));

    res.json({ success: true, data: available });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public booking submission
router.post('/book', async (req, res) => {
  try {
    const { roomId, name, phone, numberOfPersons, expectedCheckIn, bookingDate, country } = req.body;
    
    if (!roomId || !name || !phone || !numberOfPersons) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const bookDate = bookingDate ? new Date(bookingDate) : new Date();
    const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 60);
    if (bookDate > maxDate) return res.status(400).json({ success: false, message: 'Cannot book more than 60 days ahead' });

    const booking = await Booking.create({
      room: roomId,
      roomNumber: room.roomNumber,
      guests: [{ name, phone, country: country || 'Indian', isLead: true }],
      numberOfPersons,
      bookingDate: bookDate,
      expectedCheckIn: expectedCheckIn ? new Date(expectedCheckIn) : null,
      status: 'webBooking',
      source: 'Website',
      isWebBooking: true,
      isAlerRead: false,
      totalAmount: 0,
      paidAmount: 0
    });

    await Log.create({
      action: 'WEB_BOOKING',
      module: 'public',
      details: `Web booking by ${name} (${phone}) for room ${room.roomNumber}`,
      dataAffected: { bookingId: booking._id, name, phone },
      timestamp: new Date()
    });

    res.status(201).json({ success: true, message: 'Booking request submitted! We will confirm shortly.', bookingId: booking.bookingId });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
