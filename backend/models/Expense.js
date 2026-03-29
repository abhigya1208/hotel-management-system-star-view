const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: { type: String, enum: ['Salary', 'Staff Advance', 'Laundry', 'Repair', 'Utilities', 'Food', 'Other'], required: true },
  categoryCustom: { type: String, default: '' },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  personName: { type: String, default: '' },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Online'], default: 'Cash' },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
