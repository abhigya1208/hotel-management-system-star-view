const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { module, userId, page = 1, limit = 100, startDate, endDate } = req.query;
    let query = {};
    if (module) query.module = module;
    if (userId) query.user = userId;
    if (startDate && endDate) query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    const total = await Log.countDocuments(query);
    const logs = await Log.find(query).sort({ timestamp: -1 }).skip((page-1)*limit).limit(parseInt(limit));
    res.json({ success: true, data: logs, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
