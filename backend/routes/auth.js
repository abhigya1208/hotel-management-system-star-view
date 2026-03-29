const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize, logAction } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username });
    if (!user || !user.active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // ✅ FIX: Create a fake request object that logAction expects
    const fakeReq = { user: user, ip: req.ip };
    await logAction(fakeReq, 'LOGIN', 'auth', `User ${user.name} logged in`, { userId: user._id });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Get all users (admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create user (admin only)
router.post('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { username, password, role, name } = req.body;
    const user = await User.create({ username, password, role, name, createdBy: req.user._id });
    await logAction(req, 'CREATE_USER', 'user', `Created user ${name} with role ${role}`, { username, role });
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update user (admin only)
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, role, active, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (role) user.role = role;
    if (active !== undefined) user.active = active;
    if (password) user.password = password;

    await user.save();
    await logAction(req, 'UPDATE_USER', 'user', `Updated user ${user.name}`, { userId: user._id });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await logAction(req, 'DELETE_USER', 'user', `Deleted user ${user.name}`, { userId: req.params.id });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;