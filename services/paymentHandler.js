const axios = require('axios');
const Transaction = require('../models/Transaction');

class PaymentHandler {
  constructor(bot) {
    this.bot = bot;
  }

  // ক্রিপ্টোবট পেমেন্ট ইনভয়েস তৈরি
  async createCryptoInvoice(chatId, amount, currency = 'TON') {
    try {
      const response = await axios.post('https://pay.crypt.bot/api/createInvoice', {
        asset: currency,
        amount: amount,
        description: 'Game Top-Up',
        hidden_message: 'পেমেন্ট কনফার্ম হওয়ার পর অটো ডেলিভারি হবে',
        callback_url: `${process.env.BASE_URL}/webhook/crypto`
      }, {
        headers: { 'Crypto-Pay-API-Token': process.env.CRYPTO_BOT_TOKEN }
      });

      const invoice = response.data.result;
      
      // ট্রানজ্যাকশন সেভ
      const transaction = new Transaction({
        userId: chatId,
        paymentMethod: 'crypto',
        paymentStatus: 'pending',
        amount: amount,
        currency: currency,
        paymentTxId: invoice.invoice_id
      });
      await transaction.save();

      return invoice.pay_url;
    } catch (error) {
      console.error('Crypto invoice error:', error);
      return null;
    }
  }

  // TON পেমেন্ট ইনভয়েস
  async createTONInvoice(chatId, amount) {
    // TON Connect ইন্টিগ্রেশন
    const tonPaymentLink = `ton://transfer/eq...?amount=${amount * 1e9}`;
    
    const transaction = new Transaction({
      userId: chatId,
      paymentMethod: 'ton',
      paymentStatus: 'pending',
      amount: amount
    });
    await transaction.save();

    return tonPaymentLink;
  }

  // পেমেন্ট ওয়েবহুক হ্যান্ডলার
  async handlePaymentWebhook(data) {
    const { invoice_id, status, payload } = data;
    
    const transaction = await Transaction.findOne({ paymentTxId: invoice_id });
    if (!transaction) return false;

    if (status === 'paid') {
      transaction.paymentStatus = 'paid';
      await transaction.save();
      
      // ডেলিভারি সার্ভিস কল
      const deliveryHandler = new DeliveryHandler(this.bot);
      await deliveryHandler.processDelivery(transaction);
      
      return true;
    }
    return false;
  }
}

module.exports = PaymentHandler;
