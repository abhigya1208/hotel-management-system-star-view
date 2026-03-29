const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, default: 'Indian' },
  phone: { type: String, default: '' },
  isLead: { type: Boolean, default: false }
});

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  roomNumber: { type: String },
  guests: [guestSchema],
  numberOfPersons: { type: Number, required: true, min: 1 },
  checkIn: { type: Date },
  checkOut: { type: Date },
  bookingDate: { type: Date, default: Date.now },
  expectedCheckIn: { type: Date },
  status: { type: String, enum: ['pending', 'confirmed', 'checkedIn', 'checkedOut', 'cancelled', 'webBooking'], default: 'pending' },
  source: { type: String, enum: ['Direct', 'OTA', 'Booking.com', 'Commission', 'Direct Continue', 'OTA Continue', 'Other', 'Website'], default: 'Direct' },
  sourceCustom: { type: String, default: '' },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Online', 'Mixed'], default: 'Cash' },
  notes: { type: String, default: '' },
  isWebBooking: { type: Boolean, default: false },
  isAlerRead: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRepeatCustomer: { type: Boolean, default: false }
}, { timestamps: true });

bookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    this.bookingId = 'BK' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-3).toUpperCase();
  }
  this.remainingAmount = this.totalAmount - this.paidAmount;
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
