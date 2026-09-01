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

<<<<<<< HEAD
module.exports = mongoose.model('Order', orderSchema);
=======
module.exports = mongoose.model('Order', orderSchema);
>>>>>>> 36a5fee7ab8195b4a1e1f9d144814ae5f6530a1e
