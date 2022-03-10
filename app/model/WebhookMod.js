const crypto = require('crypto');
const util = require('util');
const logger = require('../libs/logger');
const parser = require('xml2js').parseString;

const parseXml = util.promisify(parser);

const PKCS7Encoder = {};

PKCS7Encoder.decode = function (text) {
  let pad = text[text.length - 1];
  if (pad < 1 || pad > 32) {
    pad = 0;
  }
  return text.slice(0, text.length - pad);
};

PKCS7Encoder.encode = function (text) {
  const blockSize = 32;
  const textLength = text.length;
  const amountToPad = blockSize - (textLength % blockSize);
  const result = Buffer.from(amountToPad);
  result.fill(amountToPad);
  return Buffer.concat([text, result]);
};

class WebhookMod {
  async plex (req) {
    const payload = JSON.parse(req.body.payload);
    const eventMap = {
      'library-new': '媒体已添加',
      'media-play': '播放已开始',
      'media-pause': '播放已暂停',
      'media-resume': '播放已恢复',
      'media-stop': '播放已停止'
    };
    const event = eventMap[payload.event.replace('.', '-')] + ': ' + payload.Metadata.title + ' / ' + (payload.Metadata.originalTitle || '');
    const server = payload.Server.title;
    const note = `用户: ${payload.Account.title}\n` +
      `媒体: ${payload.Metadata.title} / ${payload.Metadata.originalTitle || ''}\n` +
      `服务器: ${payload.Server.title}\n` +
      `媒体库: ${payload.Metadata.librarySectionTitle}\n`;
    if (global.webhookPush) {
      await global.webhookPush.plexWebhook(event, note);
    }
    return '';
  }

  async wechat (req) {
    let body;
    if (!req.body || !req.query.timestamp || !req.query.nonce) {
      return '请求格式错误!!';
    }
    try {
      body = await parseXml(await req.body);
    } catch (e) {
      logger.error(e);
      return '请求格式错误!!';
    }
    const query = req.query;
    const aesKey = Buffer.from(global.wechatAesKey, 'base64').toString('hex');
    const token = global.wechatToken;
    const encryptStr = body.xml.Encrypt[0];
    const encodingStr = [token, query.timestamp, query.nonce, encryptStr].sort().join('');
    const sign = crypto.createHash('sha1').update(encodingStr).digest('hex').toLowerCase();
    if (sign !== query.msg_signature) return '签名错误!!';
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(aesKey, 'hex'), Buffer.from(aesKey.substring(32), 'hex'));
    decipher.setAutoPadding(false);
    let decodeBuffer = Buffer.concat([decipher.update(Buffer.from(encryptStr, 'base64')), (decipher.final())]);
    decodeBuffer = PKCS7Encoder.decode(decodeBuffer);
    let content = decodeBuffer.slice(16);
    const length = content.slice(0, 4).readUInt32BE(0);
    content = content.slice(4, length + 4).toString();
    content = await parseXml(content);
    console.log(content);
    if (content.xml.Content[0].trim() === '刷新豆瓣') {
      logger.debug(content);
      for (const douban of Object.keys(global.runningDouban)) {
        if (global.runningDouban[douban] && global.runningDouban[douban].enableWechatLink);
        global.runningDouban[douban].wechatLink('refresh');
      }
    }
    return 'ok';
  }
}
module.exports = WebhookMod;
