const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  role: { type: String },
  action: {
    type: String,
    enum: [
      'LOGIN', 'LOGOUT',
      'BOOKING_CREATE', 'BOOKING_EDIT', 'BOOKING_DELETE', 'BOOKING_CHECKIN', 'BOOKING_CHECKOUT',
      'EXPENSE_CREATE', 'EXPENSE_EDIT', 'EXPENSE_DELETE',
      'SIR_PAYMENT_CREATE', 'SIR_PAYMENT_EDIT', 'SIR_PAYMENT_DELETE',
      'ROOM_CREATE', 'ROOM_EDIT', 'ROOM_DELETE', 'ROOM_STATUS_CHANGE',
      'USER_CREATE', 'USER_EDIT', 'USER_DELETE',
      'PRICE_CHANGE',
      'PUBLIC_BOOKING',
      'REPORT_EXPORT',
    ],
    required: true,
  },
  description: { type: String },
  affectedId: { type: mongoose.Schema.Types.ObjectId },
  affectedModel: { type: String },
  previousData: { type: Object },
  newData: { type: Object },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

logSchema.index({ timestamp: -1 });
logSchema.index({ user: 1 });
logSchema.index({ action: 1 });

module.exports = mongoose.model('Log', logSchema);
