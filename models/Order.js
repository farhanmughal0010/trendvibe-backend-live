// trendvibe-backend/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  items: { type: Array, required: true },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'Rs' },
  status: { type: String, default: 'Processing' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);