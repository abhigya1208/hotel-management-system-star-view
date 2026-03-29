const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true, trim: true },
  roomType: { type: String, required: true, enum: ['Deluxe', 'Normal', 'Suite', 'Super Deluxe', 'Standard'] },
  status: { type: String, enum: ['vacant', 'occupied', 'ready', 'maintenance'], default: 'vacant' },
  floor: { type: String, default: '' },
  description: { type: String, default: '' },
  basePrice: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
