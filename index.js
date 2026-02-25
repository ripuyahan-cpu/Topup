HERE' TelegramBot = require('node-telegram-bot-api');

// আপনার বট টোকেন দিন
const token = '8776366474:AAH-pvKRKp0r4ycJb3h5JmnAEOCLw0yTIz8';
const bot = new TelegramBot(token, { polling: true });

// ডায়মন্ড প্যাকেজ ডাটা
const packages = {
    'ff_115': { name: "115 Diamonds", price: 85 },
    'ff_240': { name: "240 Diamonds", price: 165 },
    'pubg_60': { name: "60 UC", price: 90 },
    'pubg_325': { name: "325 UC", price: 450 }
};

// ইউজারের স্টেট সেভ করার জন্য
const userState = {};

// ১. স্টার্ট কমান্ড
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userState[chatId] = {}; // স্টেট ক্লিয়ার করা
    
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '💎 Free Fire Diamond', callback_data: 'menu_ff' }],
                [{ text: '🔫 PUBG UC', callback_data: 'menu_pubg' }]
            ]
        }
    };
    bot.sendMessage(chatId, "কোন গেমের টপআপ করতে চান? নিচের বাটন চাপুন:", opts);
});

// ২. বাটন হ্যান্ডলার
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === 'menu_ff') {
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💎 115 Dia - 85 TK', callback_data: 'ff_115' }],
                    [{ text: '💎 240 Dia - 165 TK', callback_data: 'ff_240' }]
                ]
            }
        };
        bot.sendMessage(chatId, "প্যাকেজ বেছে নিন:", opts);
    } 
    
    else if (packages[data]) {
        userState[chatId].package = packages[data];
        bot.sendMessage(chatId, `আপনি **${packages[data].name}** বেছে নিয়েছেন।\n\nএখন আপনার **Player ID / UID** টাইপ করে পাঠান:`, { parse_mode: 'Markdown' });
        userState[chatId].step = 'AWAITING_ID';
    }
    
    bot.answerCallbackQuery(query.id);
});

// ৩. ইউজার ইনপুট (UID এবং পেমেন্ট ভেরিফিকেশন)
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!userState[chatId] || text.startsWith('/')) return;

    // ধাপ ১: UID গ্রহণ
    if (userState[chatId].step === 'AWAITING_ID') {
        userState[chatId].uid = text;
        const pkg = userState[chatId].package;
        
        const paymentMsg = `📋 **অর্ডার ডিটেইলস:**\n` +
            `গেম: ${pkg.name}\n` +
            `আইডি: ${text}\n` +
            `পরিমাণ: ${pkg.price} TK\n\n` +
            `💰 **পেমেন্ট করুন:**\n` +
            `বিকাশ (Personal): 017XXXXXXXX\n` +
            `টাকা পাঠিয়ে ট্রানজেকশন আইডি (TrxID) এখানে দিন:`;
            
        bot.sendMessage(chatId, paymentMsg, { parse_mode: 'Markdown' });
        userState[chatId].step = 'AWAITING_TRXID';
    } 
    
    // ধাপ ২: TrxID গ্রহণ ও ফিনিশিং
    else if (userState[chatId].step === 'AWAITING_TRXID') {
        const trxId = text;
        const uid = userState[chatId].uid;
        const pkgName = userState[chatId].package.name;

        bot.sendMessage(chatId, `✅ **অর্ডার সাবমিট হয়েছে!**\n\nআপনার TrxID: \`${trxId}\` ভেরিফাই করা হচ্ছে। ৫ মিনিটের মধ্যে আপনার আইডিতে ডায়মন্ড চলে যাবে।`, { parse_mode: 'Markdown' });

        // অ্যাডমিনকে নোটিফিকেশন পাঠানো (এখানে আপনার নিজের Chat ID দিতে পারেন)
        // bot.sendMessage(YOUR_ADMIN_CHAT_ID, `নতুন অর্ডার!\nID: ${uid}\nPkg: ${pkgName}\nTrx: ${trxId}`);
        
        delete userState[chatId]; // অর্ডার শেষ, স্টেট ডিলিট
    }
});
