const mongoose = require('mongoose');

const sirPaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Online'], default: 'Cash' },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('SirPayment', sirPaymentSchema);
