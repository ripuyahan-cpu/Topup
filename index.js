const TelegramBot = require('node-telegram-bot-api');

// এখানে আপনার BotFather থেকে পাওয়া টোকেনটি বসান
const token = '8776366474:AAH-pvKRKp0r4ycJb3h5JmnAEOCLw0yTIz8';
const bot = new TelegramBot(token, { polling: true });

// গেম লিস্ট এবং প্রাইস (এখানে আপনি আপনার পছন্দমতো প্রাইস আপডেট করতে পারবেন)
const priceList = {
    freefire: "🔥 *Free Fire Diamond Price (Legal)*\n\n" +
              "💎 115 Diamonds - 85 BDT\n" +
              "💎 240 Diamonds - 165 BDT\n" +
              "💎 610 Diamonds - 430 BDT\n" +
              "💎 Weekly Membership - 160 BDT\n\n" +
              "টপআপ করতে আপনার UID প্রদান করুন।",
    
    pubg: "🔫 *PUBG UC Price (Legal)*\n\n" +
          "💵 60 UC - 90 BDT\n" +
          "💵 325 UC - 450 BDT\n" +
          "💵 660 UC - 880 BDT\n" +
          "💵 Royale Pass - 850 BDT\n\n" +
          "টপআপ করতে আপনার Character ID প্রদান করুন।",
    
    coc: "🏰 *Clash of Clans Gold Pass/Gems*\n\n" +
         "💎 500 Gems - 450 BDT\n" +
         "🎟️ Gold Pass - 650 BDT\n\n" +
         "টপআপ করতে আপনার Player Tag প্রদান করুন।"
};

// স্টার্ট মেনু
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🎮 Free Fire Diamond', callback_data: 'ff' }],
                [{ text: '🔫 PUBG UC', callback_data: 'pubg' }],
                [{ text: '🏰 Clash of Clans', callback_data: 'coc' }]
            ]
        },
        parse_mode: 'Markdown'
    };
    bot.sendMessage(chatId, "স্বাগতম! আপনি কোন গেমের টপআপ করতে চান? নিচের অপশন থেকে বেছে নিন:", opts);
});

// বাটন ক্লিক হ্যান্ডলার
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === 'ff') {
        bot.sendMessage(chatId, priceList.freefire, { parse_mode: 'Markdown' });
    } else if (data === 'pubg') {
        bot.sendMessage(chatId, priceList.pubg, { parse_mode: 'Markdown' });
    } else if (data === 'coc') {
        bot.sendMessage(chatId, priceList.coc, { parse_mode: 'Markdown' });
    }

    // বাটন ক্লিকের লোডিং অ্যানিমেশন বন্ধ করতে
    bot.answerCallbackQuery(query.id);
});

console.log("বটটি সফলভাবে চালু হয়েছে...");
