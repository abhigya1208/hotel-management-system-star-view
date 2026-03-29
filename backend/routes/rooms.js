const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect, authorize, logAction } = require('../middleware/auth');

// Get all rooms
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find({ active: true }).sort({ roomNumber: 1 });
    res.json({ success: true, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create room (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await Room.create({ ...req.body, createdBy: req.user._id });
    await logAction(req, 'CREATE_ROOM', 'room', `Created room ${room.roomNumber}`, { roomId: room._id });
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update room status (manager+)
router.put('/:id/status', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    await logAction(req, 'UPDATE_ROOM_STATUS', 'room', `Room ${room.roomNumber} status → ${req.body.status}`, { roomId: room._id, status: req.body.status });
    res.json({ success: true, data: room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update room (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    await logAction(req, 'UPDATE_ROOM', 'room', `Updated room ${room.roomNumber}`, { roomId: room._id });
    res.json({ success: true, data: room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete room (admin only) - soft delete
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    await logAction(req, 'DELETE_ROOM', 'room', `Deleted room ${room.roomNumber}`, { roomId: req.params.id });
    res.json({ success: true, message: 'Room removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
