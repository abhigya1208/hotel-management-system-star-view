const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect, authorize, logAction } = require('../middleware/auth');

const isSameDay = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
};

router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate, category, page = 1, limit = 50 } = req.query;
    let query = {};
    if (req.user.role === 'manager') {
      const today = new Date(); today.setHours(0,0,0,0);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = { $gte: yesterday, $lt: tomorrow };
    } else if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (category) query.category = category;
    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query).populate('createdBy', 'name').sort({ date: -1 }).skip((page-1)*limit).limit(parseInt(limit));
    res.json({ success: true, data: expenses, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, createdBy: req.user._id });
    await logAction(req, 'CREATE_EXPENSE', 'expense', `Expense: ${expense.category} ₹${expense.amount}`, { expenseId: expense._id });
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (req.user.role === 'manager' && !isSameDay(expense.date)) {
      return res.status(403).json({ success: false, message: 'Managers can only edit today\'s expenses' });
    }
    const updated = await Expense.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true });
    await logAction(req, 'UPDATE_EXPENSE', 'expense', `Updated expense ${expense._id}`, { expenseId: expense._id });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    await logAction(req, 'DELETE_EXPENSE', 'expense', `Deleted expense ${req.params.id}`, {});
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
