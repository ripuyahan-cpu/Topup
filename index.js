const TelegramBot = require('node-telegram-bot-api');

// এখানে আপনার BotFather থেকে পাওয়া টোকেনটি বসান
const token = '8776366474:AAH-pvKRKp0r4ycJb3h5JmnAEOCLw0yTIz8'; 
const bot = new TelegramBot(token, { polling: true });

// গেম লিস্ট এবং প্রাইস ডাটা
const games = {
    ff: {
        name: "Free Fire Diamonds",
        prices: "🔥 *Free Fire Diamond Price (Legal)*\n\n" +
                "💎 115 Diamonds - 85 BDT\n" +
                "💎 240 Diamonds - 165 BDT\n" +
                "💎 610 Diamonds - 430 BDT\n" +
                "💎 Weekly Membership - 160 BDT\n\n" +
                "👉 টপআপ করতে আপনার **UID** লিখে মেসেজ পাঠান।"
    },
    pubg: {
        name: "PUBG UC",
        prices: "🔫 *PUBG UC Price (Legal)*\n\n" +
                "💵 60 UC - 90 BDT\n" +
                "💵 325 UC - 450 BDT\n" +
                "💵 660 UC - 880 BDT\n" +
                "💵 Royale Pass - 850 BDT\n\n" +
                "👉 টপআপ করতে আপনার **Character ID** লিখে মেসেজ পাঠান।"
    },
    coc: {
        name: "Clash of Clans",
        prices: "🏰 *Clash of Clans Gold Pass/Gems*\n\n" +
                "💎 500 Gems - 450 BDT\n" +
                "🎟️ Gold Pass - 650 BDT\n\n" +
                "👉 টপআপ করতে আপনার **Player Tag** লিখে মেসেজ পাঠান।"
    }
};

// ১. স্টার্ট মেনু
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
    bot.sendMessage(chatId, "স্বাগতম! আপনি কোন গেমের টপআপ করতে চান? নিচের বাটন থেকে সিলেক্ট করুন:", opts);
});

// ২. বাটন ক্লিক হ্যান্ডলার (প্রাইস লিস্ট দেখাবে)
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (games[data]) {
        bot.sendMessage(chatId, games[data].prices, { parse_mode: 'Markdown' });
    }
    bot.answerCallbackQuery(query.id);
});

// ৩. ইউজার যখন UID বা আইডি লিখে পাঠাবে (রেসপন্স লজিক)
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // যদি মেসেজটি কমান্ড না হয় (যেমন /start না হয়) এবং সাধারণ টেক্সট হয়
    if (text && !text.startsWith('/')) {
        const response = `✅ **আইডি রিসিভ হয়েছে!**\n\n` +
                         `আপনার আইডি: \`${text}\` \n\n` +
                         `💰 **পেমেন্ট ইনস্ট্রাকশন:**\n` +
                         `বিকাশ/নগদ (Personal): 017XXXXXXXX\n` +
                         `টাকা পাঠিয়ে লাস্ট ৩ ডিজিট এখানে লিখুন। আমাদের অ্যাডমিন ৫-১০ মিনিটের মধ্যে টপআপ কমপ্লিট করে দেবে।`;
        
        bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    }
});

console.log("বট সফলভাবে রান হয়েছে... এখন মেসেজ দিলে রিপ্লাই দিবে।");
