const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');

// Protect middleware – verifies JWT and attaches user to req
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Also check for token in cookies (optional)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('User not found for id:', decoded.id);
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    if (!user.active) {
      console.log('User is deactivated:', user.username);
      return res.status(401).json({ success: false, message: 'User account is deactivated' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// Authorize middleware – checks role(s)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`,
      });
    }
    next();
  };
};

// Log action helper
exports.logAction = async (req, action, module, details, dataAffected = {}) => {
  try {
    const log = new Log({
      user: req.user?._id || null,
      userName: req.user?.name || 'System',
      userRole: req.user?.role || 'guest',
      action,
      module,
      details,
      dataAffected,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      timestamp: new Date(),
    });
    await log.save();
  } catch (error) {
    console.error('Failed to save log:', error);
  }
};

// Helper: check if a date is today
exports.isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

// Helper: check if a date is yesterday
exports.isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date);
  return d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
};