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

  async emby (req) {
    const payload = JSON.parse(req.body.data);
    const eventMap = {
      newItemAdded: '媒体已添加',
      playbackStart: '播放已开始',
      playbackStop: '播放已停止'
    };
    const event = eventMap[payload.event] + ': ' + payload.itemName + ' / ' + (payload.originalName || '');
    const server = payload.serverName;
    const note = `用户: ${payload.userName}\n` +
      `媒体: ${payload.itemName} / ${payload.originalName || ''}\n` +
      `服务器: ${payload.serverName}\n` +
      `媒体库: ${payload.libraryName}\n`;
    if (global.webhookPush) {
      await global.webhookPush.embyWebhook(event, note);
    }
    return '';
  }

  async jellyfin (req) {
    const payload = req.body;
    const eventMap = {
      ItemAdded: '媒体已添加',
      PlaybackStart: '播放已开始',
      PlaybackStop: '播放已停止'
    };
    const event = eventMap[payload.NotificationType] + ': ' + payload.Name + ' / ' + (payload.SeriesName || '');
    const server = payload.serverName;
    const note = `用户: ${payload.NotificationUsername}\n` +
      `媒体: ${payload.Name} / ${payload.SeriesName || ''}\n` +
      `服务器: ${payload.ServerName}\n`;
    if (global.webhookPush) {
      await global.webhookPush.jellyfinWebhook(event, note);
    }
    return '';
  }

  async wechat (req) {
    let body;
    const query = req.query;
    if (!req.body || !req.query.timestamp || !req.query.nonce) {
      return '请求格式错误!!';
    }
    if (!query.echostr) {
      try {
        body = await parseXml(await req.body);
      } catch (e) {
        logger.error(e);
        return '请求格式错误!!';
      }
    }
    const aesKey = Buffer.from(global.wechatAesKey, 'base64').toString('hex');
    const token = global.wechatToken;
    const encryptStr = query.echostr || body.xml.Encrypt[0];
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
    if (query.echostr) return content;
    content = await parseXml(content);
    logger.debug(content);
    const text = content.xml.Content[0].trim();
    if (text === '刷新豆瓣') {
      for (const _douban of Object.keys(global.runningDouban)) {
        const douban = global.runningDouban[_douban];
        if (douban && douban.enableWechatLink) {
          douban.wechatLink('refresh');
        }
      }
      return content;
    }
    if (text.indexOf('刷新') === 0) {
      for (const _douban of Object.keys(global.runningDouban)) {
        const douban = global.runningDouban[_douban];
        if (douban && douban.enableWechatLink && text.indexOf(douban.alias) !== -1) {
          douban.wechatLink('refresh');
        }
      }
    }
    return content;
  }
}
module.exports = WebhookMod;
