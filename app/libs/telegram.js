const util = require('./util');

class Telegram {
  constructor (token, id, parseMode, domain = 'api.telegram.org') {
    this.domain = domain;
    this.token = token;
    this.id = id;
    this.parseMode = parseMode || 'HTML';
  };

  async sendMessage (message) {
    const option = {
      url: 'https://' + this.domain + '/bot' + this.token + '/sendMessage',
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
      url: 'https://' + this.domain + '/bot' + this.token + '/editMessageText',
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
      url: 'https://' + this.domain + '/bot' + this.token + '/deleteMessage',
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
