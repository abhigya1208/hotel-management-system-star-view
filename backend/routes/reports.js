const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Expense = require('../models/Expense');
const SirPayment = require('../models/SirPayment');
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/auth');

// Dashboard summary
router.get('/dashboard', protect, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayBookings, monthBookings, todayExpenses, monthExpenses, todaySirPayments, monthSirPayments, rooms, webAlerts] = await Promise.all([
      Booking.find({ bookingDate: { $gte: today, $lt: tomorrow }, status: { $nin: ['cancelled'] } }),
      Booking.find({ bookingDate: { $gte: monthStart }, status: { $nin: ['cancelled'] } }),
      Expense.find({ date: { $gte: today, $lt: tomorrow } }),
      Expense.find({ date: { $gte: monthStart } }),
      SirPayment.find({ date: { $gte: today, $lt: tomorrow } }),
      SirPayment.find({ date: { $gte: monthStart } }),
      Room.find({ active: true }),
      Booking.find({ isWebBooking: true, isAlerRead: false, status: 'webBooking' }),
    ]);

    const todayRevenue = todayBookings.reduce((s, b) => s + b.paidAmount, 0);
    const monthRevenue = monthBookings.reduce((s, b) => s + b.paidAmount, 0);
    const todayExpTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
    const monthExpTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const todaySirTotal = todaySirPayments.reduce((s, p) => s + p.amount, 0);
    const monthSirTotal = monthSirPayments.reduce((s, p) => s + p.amount, 0);
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;

    res.json({
      success: true,
      data: {
        today: { bookings: todayBookings.length, revenue: todayRevenue, expenses: todayExpTotal, sirPayments: todaySirTotal },
        month: { bookings: monthBookings.length, revenue: monthRevenue, expenses: monthExpTotal, sirPayments: monthSirTotal },
        rooms: { total: rooms.length, occupied: occupiedRooms, vacant: rooms.filter(r => r.status === 'vacant').length, maintenance: rooms.filter(r => r.status === 'maintenance').length, ready: rooms.filter(r => r.status === 'ready').length, occupancyRate },
        webAlerts: webAlerts.length,
        webAlertBookings: webAlerts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Analytics - day-wise trends
router.get('/analytics', protect, authorize('admin', 'leaser'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(); startDate.setDate(startDate.getDate() - parseInt(days)); startDate.setHours(0,0,0,0);
    
    const bookings = await Booking.find({ bookingDate: { $gte: startDate }, status: { $nin: ['cancelled'] } });
    const expenses = await Expense.find({ date: { $gte: startDate } });
    
    const dayMap = {};
    bookings.forEach(b => {
      const key = new Date(b.bookingDate).toISOString().split('T')[0];
      if (!dayMap[key]) dayMap[key] = { date: key, bookings: 0, revenue: 0, expenses: 0 };
      dayMap[key].bookings++;
      dayMap[key].revenue += b.paidAmount;
    });
    expenses.forEach(e => {
      const key = new Date(e.date).toISOString().split('T')[0];
      if (!dayMap[key]) dayMap[key] = { date: key, bookings: 0, revenue: 0, expenses: 0 };
      dayMap[key].expenses += e.amount;
    });

    const trend = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
    const maxDay = trend.reduce((m, d) => d.bookings > (m?.bookings || 0) ? d : m, null);
    const minDay = trend.filter(d => d.bookings > 0).reduce((m, d) => d.bookings < (m?.bookings || Infinity) ? d : m, null);

    res.json({ success: true, data: { trend, maxBookingDay: maxDay, minBookingDay: minDay } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Full report for date range
router.get('/range', protect, authorize('admin', 'leaser'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate); start.setHours(0,0,0,0);
    const end = new Date(endDate); end.setHours(23,59,59,999);

    const [bookings, expenses, sirPayments] = await Promise.all([
      Booking.find({ bookingDate: { $gte: start, $lte: end }, status: { $nin: ['cancelled'] } }).populate('room', 'roomNumber roomType'),
      Expense.find({ date: { $gte: start, $lte: end } }),
      SirPayment.find({ date: { $gte: start, $lte: end } }),
    ]);

    const totalRevenue = bookings.reduce((s, b) => s + b.paidAmount, 0);
    const totalPending = bookings.reduce((s, b) => s + b.remainingAmount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalSirPayments = sirPayments.reduce((s, p) => s + p.amount, 0);
    const salaryExpenses = expenses.filter(e => e.category === 'Salary').reduce((s, e) => s + e.amount, 0);
    const advanceExpenses = expenses.filter(e => e.category === 'Staff Advance').reduce((s, e) => s + e.amount, 0);

    const bySource = {};
    bookings.forEach(b => {
      const src = b.source;
      if (!bySource[src]) bySource[src] = { count: 0, revenue: 0 };
      bySource[src].count++;
      bySource[src].revenue += b.paidAmount;
    });

    res.json({
      success: true,
      data: {
        bookings, expenses, sirPayments,
        summary: { totalRevenue, totalPending, totalExpenses, totalSirPayments, salaryExpenses, advanceExpenses, netProfit: totalRevenue - totalExpenses - totalSirPayments, totalBookings: bookings.length },
        bySource
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
