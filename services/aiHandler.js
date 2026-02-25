const axios = require('axios');

class AIHandler {
  constructor(bot) {
    this.bot = bot;
  }

  async processUserMessage(chatId, message, context) {
    try {
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a top-up bot assistant. Help this user: ${message}\nContext: ${JSON.stringify(context)}`
        }]
      }, {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      });

      return response.data.content[0].text;
    } catch (error) {
      console.error('AI error:', error);
      return "দুঃখিত, এখনই উত্তর দিতে পারছি না। সরাসরি /topup কমান্ড ব্যবহার করুন।";
    }
  }

  async suggestPackage(chatId, gameId, uid) {
    // AI বিশ্লেষণ করে প্যাকেজ সুপারিশ করবে
    const prompt = `Based on user's UID ${uid} for game ${gameId}, suggest which diamond package would be best value.`;
    return this.processUserMessage(chatId, prompt, { gameId, uid });
  }
}

module.exports = AIHandler;
