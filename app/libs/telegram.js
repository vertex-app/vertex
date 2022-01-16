const util = require('./util');
const config = require('./config');

const telegramConfig = config.getTelegramConfig();

class Telegram {
  constructor (token, id, parseMode, host = 'https://api.telegram.org') {
    this.host = telegramConfig.host || host;
    this.token = token;
    this.id = id;
    this.parseMode = parseMode || 'HTML';
  };

  async sendMessage (message) {
    const option = {
      url: this.host + '/bot' + this.token + '/sendMessage',
      method: 'POST',
      json: true,
      body: {
        chat_id: this.id,
        text: message,
        parse_mode: this.parseMode
      }
    };
    const res = await util.requestPromise(option);
    return res;
  }

  async editMessage (messageId, message) {
    const option = {
      url: this.host + '/bot' + this.token + '/editMessageText',
      method: 'POST',
      json: true,
      body: {
        chat_id: this.id,
        message_id: messageId,
        text: message,
        parse_mode: this.parseMode
      }
    };
    const res = await util.requestPromise(option);
    return res;
  }

  async deleteMessage (messageId) {
    const option = {
      url: this.host + '/bot' + this.token + '/deleteMessage',
      method: 'POST',
      json: true,
      body: {
        chat_id: this.id,
        message_id: messageId
      }
    };
    const res = await util.requestPromise(option);
    return res;
  }
}
module.exports = Telegram;
