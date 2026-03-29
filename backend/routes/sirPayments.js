const express = require('express');
const router = express.Router();
const SirPayment = require('../models/SirPayment');
const { protect, authorize, logAction } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    let query = {};
    if (req.user.role === 'manager') {
      const today = new Date(); today.setHours(0,0,0,0);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = { $gte: yesterday, $lt: tomorrow };
    } else if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const total = await SirPayment.countDocuments(query);
    const payments = await SirPayment.find(query).populate('createdBy', 'name').sort({ date: -1 }).skip((page-1)*limit).limit(parseInt(limit));
    res.json({ success: true, data: payments, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const payment = await SirPayment.create({ ...req.body, createdBy: req.user._id });
    await logAction(req, 'CREATE_SIR_PAYMENT', 'sirpayment', `Sir Payment ₹${payment.amount}`, { paymentId: payment._id });
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const payment = await SirPayment.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    await logAction(req, 'UPDATE_SIR_PAYMENT', 'sirpayment', `Updated sir payment ${payment._id}`, { paymentId: payment._id });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await SirPayment.findByIdAndDelete(req.params.id);
    await logAction(req, 'DELETE_SIR_PAYMENT', 'sirpayment', `Deleted sir payment ${req.params.id}`, {});
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
