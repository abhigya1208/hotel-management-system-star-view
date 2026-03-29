const express = require('express');
const router = express.Router();
const Pricing = require('../models/Pricing');
const { protect, authorize, logAction } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const pricing = await Pricing.find();
    res.json({ success: true, data: pricing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:roomType', protect, authorize('admin', 'leaser'), async (req, res) => {
  try {
    const pricing = await Pricing.findOneAndUpdate(
      { roomType: req.params.roomType },
      { ...req.body, updatedBy: req.user._id },
      { new: true, upsert: true }
    );
    await logAction(req, 'UPDATE_PRICING', 'pricing', `Updated pricing for ${req.params.roomType} to ₹${req.body.price}`, { roomType: req.params.roomType, price: req.body.price });
    res.json({ success: true, data: pricing });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
