require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('8776366474:AAH-pvKRKp0r4ycJb3h5JmnAEOCLw0yTIz8');
const mongoose = require('mongoose');

const PaymentHandler = require('./services/paymentHandler');
const DeliveryHandler = require('./services/deliveryHandler');
const AIHandler = require('./services/aiHandler');
const Transaction = require('./models/Transaction');

// এক্সপ্রেস অ্যাপ (ওয়েবহুকের জন্য)
const app = express();
app.use(bodyParser.json());

// মঙ্গোডিবি কানেকশন
mongoose.connect(process.env.MONGODB_URI);

// টেলিগ্রাম বট
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// সার্ভিস ইন্সট্যান্স
const paymentHandler = new PaymentHandler(bot);
const deliveryHandler = new DeliveryHandler(bot);
const aiHandler = new AIHandler(bot);

// ইউজার সেশন স্টোর
const userSessions = new Map();

// গেম লিস্ট
const games = [
  { id: 'ff', name: 'Free Fire', sku: 'ff100' },
  { id: 'pubg', name: 'PUBG Mobile', sku: 'pubg60' },
  { id: 'codm', name: 'Call of Duty', sku: 'codm50' }
];

// প্যাকেজ লিস্ট
const packages = {
  ff: [
    { name: '100 ডায়মন্ড', diamonds: 100, price: 60, sku: 'ff100' },
    { name: '310 ডায়মন্ড', diamonds: 310, price: 180, sku: 'ff310' },
    { name: '520 ডায়মন্ড', diamonds: 520, price: 300, sku: 'ff520' }
  ],
  pubg: [
    { name: '60 UC', uc: 60, price: 90, sku: 'pubg60' },
    { name: '300 UC', uc: 300, price: 450, sku: 'pubg300' },
    { name: '600 UC', uc: 600, price: 870, sku: 'pubg600' }
  ]
};

// /start কমান্ড
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  const welcomeMsg = `🎮 *স্বাগতম গেম টপ-আপ বটে!*\n\n` +
    `আমি সম্পূর্ণ স্বয়ংক্রিয় একটি বট। আপনি শুধু আপনার UID দিন, বাকি সব আমি নিজেই করব!\n\n` +
    `উপলব্ধ গেম সমূহ:`;
  
  const keyboard = games.map(game => [{
    text: game.name,
    callback_data: `game_${game.id}`
  }]);
  
  await bot.sendMessage(chatId, welcomeMsg, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
});

// গেম সিলেক্ট হ্যান্ডলার
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  if (data.startsWith('game_')) {
    const gameId = data.replace('game_', '');
    userSessions.set(chatId, { gameId, step: 'uid' });
    
    await bot.sendMessage(chatId, `আপনার ${games.find(g => g.id === gameId).name} এর UID দিন:`);
  }
  
  else if (data.startsWith('pkg_')) {
    const [_, gameId, pkgIndex] = data.split('_');
    const session = userSessions.get(chatId);
    const pkg = packages[gameId][parseInt(pkgIndex)];
    
    session.selectedPackage = pkg;
    session.step = 'payment';
    
    // পেমেন্ট অপশন
    const paymentKeyboard = [
      [{ text: '💎 TON (ক্রিপ্টো)', callback_data: 'pay_ton' }],
      [{ text: '₿ CryptoBot', callback_data: 'pay_crypto' }]
    ];
    
    await bot.sendMessage(chatId, 
      `আপনার নির্বাচিত প্যাকেজ:\n` +
      `📦 *${pkg.name}*\n` +
      `💰 মূল্য: ${pkg.price} টাকা\n\n` +
      `পেমেন্ট পদ্ধতি বেছে নিন:`,
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: paymentKeyboard }
      }
    );
  }
  
  else if (data.startsWith('pay_')) {
    const method = data.replace('pay_', '');
    const session = userSessions.get(chatId);
    
    if (!session) {
      await bot.sendMessage(chatId, 'সেশন expired, আবার /start দিন');
      return;
    }
    
    let paymentUrl;
    if (method === 'crypto') {
      paymentUrl = await paymentHandler.createCryptoInvoice(chatId, session.selectedPackage.price, 'TON');
    } else if (method === 'ton') {
      paymentUrl = await paymentHandler.createTONInvoice(chatId, session.selectedPackage.price);
    }
    
    if (paymentUrl) {
      await bot.sendMessage(chatId, 
        `✅ পেমেন্ট লিঙ্ক তৈরি হয়েছে:\n${paymentUrl}\n\n` +
        `পেমেন্ট সম্পন্ন হলে অটোমেটিক ডেলিভারি হবে। ধন্যবাদ!`
      );
      
      // সেশন ক্লিয়ার করা হবে না, ট্রানজ্যাকশন মডেলে সংরক্ষিত আছে
    } else {
      await bot.sendMessage(chatId, 'পেমেন্ট লিঙ্ক তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  }
});

// টেক্সট মেসেজ হ্যান্ডলার (UID ইনপুট এবং AI)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (text.startsWith('/')) return; // কমান্ড ইগনোর
  
  const session = userSessions.get(chatId);
  
  if (session && session.step === 'uid') {
    // UID ভ্যালিডেশন (API প্রোভাইডার দিয়ে চেক করা যায়)
    session.uid = text;
    session.step = 'package';
    
    const gamePackages = packages[session.gameId];
    const keyboard = gamePackages.map((pkg, index) => [{
      text: `${pkg.name} - ${pkg.price} টাকা`,
      callback_data: `pkg_${session.gameId}_${index}`
    }]);
    
    // AI সুপারিশ (অপশনাল)
    const aiSuggestion = await aiHandler.suggestPackage(chatId, session.gameId, text);
    if (aiSuggestion) {
      await bot.sendMessage(chatId, `💡 *AI সুপারিশ:*\n${aiSuggestion}`, { parse_mode: 'Markdown' });
    }
    
    await bot.sendMessage(chatId, 'প্যাকেজ সিলেক্ট করুন:', {
      reply_markup: { inline_keyboard: keyboard }
    });
  } else {
    // AI রেসপন্স
    const aiResponse = await aiHandler.processUserMessage(chatId, text, {});
    await bot.sendMessage(chatId, aiResponse);
  }
});

// ওয়েবহুক এন্ডপয়েন্ট (ক্রিপ্টোবট থেকে নোটিফিকেশন)
app.post('/webhook/crypto', async (req, res) => {
  const { payload } = req.body;
  await paymentHandler.handlePaymentWebhook(payload);
  res.sendStatus(200);
});

// TON ওয়েবহুক
app.post('/webhook/ton', async (req, res) => {
  // TON ট্রানজ্যাকশন ভেরিফিকেশন
  const { address, amount, hash } = req.body;
  
  const transaction = await Transaction.findOne({ 
    paymentMethod: 'ton', 
    paymentStatus: 'pending' 
  }).sort({ createdAt: -1 });
  
  if (transaction && amount >= transaction.amount) {
    transaction.paymentStatus = 'paid';
    transaction.paymentTxId = hash;
    await transaction.save();
    
    await deliveryHandler.processDelivery(transaction);
  }
  
  res.sendStatus(200);
});

// সার্ভার চালু
app.listen(process.env.PORT || 3000, () => {
  console.log('Webhook server running');
});

console.log('Bot started...');
