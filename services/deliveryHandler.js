const axios = require('axios');
const Transaction = require('../models/Transaction');

class DeliveryHandler {
  constructor(bot) {
    this.bot = bot;
  }

  async processDelivery(transaction) {
    try {
      // API প্রোভাইডারে অর্ডার পাঠান
      const sign = this.generateMD5(
        process.env.API_PROVIDER_USERNAME + 
        process.env.API_PROVIDER_KEY + 
        'deposit'
      );

      const response = await axios.post(process.env.API_PROVIDER_URL + '/transaction', {
        commands: 'topup',
        username: process.env.API_PROVIDER_USERNAME,
        sign: sign,
        ref_id: transaction._id.toString(),
        customer_no: transaction.uid,
        buyer_sku_code: transaction.package.sku,
        msg: transaction.package.name
      });

      if (response.data.data.status === 'Sukses') {
        transaction.deliveryStatus = 'success';
        transaction.providerOrderId = response.data.data.ref_id;
        await transaction.save();

        // ইউজারকে জানান
        await this.bot.sendMessage(transaction.userId, 
          `✅ *টপ-আপ সফল হয়েছে!*\n\n` +
          `গেম: ${transaction.gameId}\n` +
          `UID: ${transaction.uid}\n` +
          `${transaction.package.name}\n` +
          `স্ট্যাটাস: ডেলিভারি সম্পন্ন`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (error) {
      console.error('Delivery error:', error);
      transaction.deliveryStatus = 'failed';
      await transaction.save();
      
      // রিট্রাই মেকানিজম
      setTimeout(() => this.processDelivery(transaction), 60000);
    }
  }

  generateMD5(str) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(str).digest('hex');
  }
}

module.exports = DeliveryHandler;
