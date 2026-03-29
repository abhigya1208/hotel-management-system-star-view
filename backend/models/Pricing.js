const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  roomType: { type: String, required: true },
  price: { type: Number, required: true },
  weekendPrice: { type: Number },
  description: { type: String },
  isPublic: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Pricing', pricingSchema);
