const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  username: String,
  gameId: { type: String, required: true },
  uid: { type: String, required: true },
  package: {
    name: String,
    diamonds: Number,
    price: Number,
    currency: String
  },
  paymentMethod: { type: String, enum: ['crypto', 'ton'] },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentTxId: String,
  deliveryStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  providerOrderId: String,
  aiSuggested: Boolean,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
