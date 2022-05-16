const crypto = require('crypto');
const util = require('util');
const redis = require('../libs/redis');
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
      'media-stop': '播放已停止',
      'media-scrobble': '播放超过 90%'
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
    if (content.xml.EventKey) {
      switch (content.xml.EventKey[0]) {
      case 'refreshDouban':
        for (const _douban of Object.keys(global.runningDouban)) {
          const douban = global.runningDouban[_douban];
          if (douban && douban.enableWechatLink) {
            douban.wechatLink('refresh');
          }
        }
        return content;
      case 'select':
        let note = '';
        const doubans = Object.keys(global.runningDouban);
        const keys = [];
        for (const [index, _douban] of doubans.entries()) {
          note += doubans.indexOf(_douban) + ': ' + global.runningDouban[_douban].alias + '\n';
          keys.push({ id: index, text: `${index}: ${global.runningDouban[_douban].alias}` });
        }
        note += '5 分钟内输入有效';
        const selectors = [
          {
            question_key: 'accountIndex',
            title: '选择账号',
            option_list: keys
          }
        ];
        await global.doubanPush.pushWeChat('Vertex', '企业微信请进行选择\n普通微信请回复序号:\n' + note);
        await global.doubanPush.pushWeChatSelector('选择账号', '', selectors, 'selectAccount');
        await redis.setWithExpire('vertex:select:doubans', JSON.stringify(doubans), 300);
        return;
      case 'selectAccount': {
        const text = content.xml.SelectedItems[0].SelectedItem[0].OptionIds[0].OptionId[0];
        const doubanCache = await redis.get('vertex:select:doubans');
        const doubans = JSON.parse(doubanCache);
        const douban = doubans[text];
        await redis.del('vertex:select:doubans');
        if (+text + '' !== text || !douban) {
          await global.doubanPush.selectWish('输入非法, 本次任务已取消');
          return '';
        }
        await redis.setWithExpire('vertex:select:douban', douban, 300);
        const _note = '已选择豆瓣账户: ' + global.runningDouban[douban].alias + '\n' +
          '请输入希望搜索的影视剧名称, 5 分钟内输入有效';
        await global.doubanPush.selectWish(_note);
        return '';
      }
      case 'selectMedia': {
        const moviesCache = await redis.get('vertex:select:movies');
        const movies = JSON.parse(moviesCache);
        const num = content.xml.SelectedItems[0].SelectedItem[0].OptionIds[0].OptionId[0];
        const movie = movies[num];
        await redis.del('vertex:select:movies');
        if (+num + '' !== num || !movie) {
          await global.doubanPush.selectWish('输入非法, 本次任务已取消');
          return '';
        }
        try {
          await global.runningDouban[movie.doubanId].addWish(movie.id, content.xml.SelectedItems[0].SelectedItem[1].OptionIds[0].OptionId[0], content.xml.SelectedItems[0].SelectedItem[2].OptionIds[0].OptionId[0]);
        } catch (e) {
          logger.error(e);
          await global.doubanPush.selectWish('添加失败: ' + e.message);
          return '';
        }
        await global.doubanPush.selectWish('添加成功: ' + movie.title);
        global.runningDouban[movie.doubanId].refreshWishList(true);
        return '';
      }
      case 'selectRefreshMedia': {
        const doubans = Object.keys(global.runningDouban);
        const list = doubans.map(item => global.runningDouban[item].wishes.filter(item => !item.downloaded)).flat().map(item => { return { id: item.name, text: item.name }; });
        const selectors = [
          {
            question_key: 'mediaName',
            title: '选择剧集',
            option_list: list
          }
        ];
        await global.doubanPush.pushWeChat('Vertex', '本操作只支持企业微信, 普通微信请发送 刷新{剧集名}');
        await global.doubanPush.pushWeChatSelector('选择剧集', '', selectors, 'refreshMedia');
        return;
      }
      case 'refreshMedia': {
        for (const _douban of Object.keys(global.runningDouban)) {
          const douban = global.runningDouban[_douban];
          if (douban && douban.enableWechatLink) {
            douban.wechatLink('refreshWish', { key: content.xml.SelectedItems[0].SelectedItem[0].OptionIds[0].OptionId[0] });
          }
        }
        return;
      }
      }
    }
    const text = content.xml.Content[0].trim();
    const moviesCache = await redis.get('vertex:select:movies');
    if (moviesCache) {
      const movies = JSON.parse(moviesCache);
      const num = text.split('/')[0];
      const movie = movies[num];
      await redis.del('vertex:select:movies');
      if (+num + '' !== num || !movie) {
        await global.doubanPush.selectWish('输入非法, 本次任务已取消');
        return '';
      }
      try {
        await global.runningDouban[movie.doubanId].addWish(movie.id, text.split('/')[1] || '', text.split('/')[2] || '');
      } catch (e) {
        logger.error(e);
        await global.doubanPush.selectWish('添加失败: ' + e.message);
        return '';
      }
      await global.doubanPush.selectWish('添加成功: ' + movie.title);
      global.runningDouban[movie.doubanId].refreshWishList(true);
      return '';
    }
    const doubanCache = await redis.get('vertex:select:douban');
    if (doubanCache) {
      const douban = doubanCache;
      const result = await global.runningDouban[douban].search(text);
      if (result.length === 0) {
        await global.doubanPush.selectWish('无搜索结果');
        return '';
      }
      await redis.del('vertex:select:douban');
      const keys = [];
      for (const [index, value] of result.entries()) {
        await global.doubanPush.pushWeChat(`${index}: ${value.title} - ${value.year}`, '', value.poster);
        keys.push({ id: index, text: `${value.title} - ${value.year}` });
      }
      await redis.setWithExpire('vertex:select:movies', JSON.stringify(result), 300);
      const selectors = [
        {
          question_key: 'mediaIndex',
          title: '选择影视剧',
          option_list: keys
        },
        {
          question_key: 'tagIndex',
          title: '选择标签',
          option_list: Object.keys(global.runningDouban[douban].categories).map(item => { return { id: item, text: item }; })
        },
        {
          question_key: 'cronIndex',
          title: '选择 Cron',
          option_list: [...new Set([global.runningDouban[douban].defaultRefreshCron]
            .concat(global.runningDouban[douban].cronList.split('\n')
              .map(item => item.trim())
              .filter(item => item)
            ))].map(item => { return { id: item, text: item }; })
        }
      ];
      await global.doubanPush.pushWeChat('Vertex', '企业微信请进行选择\n普通微信请回复\n序号/标签/Cron, Cron 可空, 默认为 ' + global.runningDouban[douban].defaultRefreshCron);
      await global.doubanPush.pushWeChatSelector('选择想看', '选择以下项目添加想看项目', selectors, 'selectMedia');
      return '';
    }
    const doubansCache = await redis.get('vertex:select:doubans');
    if (doubansCache) {
      const doubans = JSON.parse(doubansCache);
      const douban = doubans[text];
      await redis.del('vertex:select:doubans');
      if (+text + '' !== text || !douban) {
        await global.doubanPush.selectWish('输入非法, 本次任务已取消');
        return '';
      }
      await redis.setWithExpire('vertex:select:douban', douban, 300);
      const note = '已选择豆瓣账户: ' + global.runningDouban[douban].alias + '\n' +
        '请输入希望搜索的影视剧名称, 5 分钟内输入有效';
      await global.doubanPush.selectWish(note);
      return '';
    }
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
          return content;
        }
      }
      const key = text.replace('刷新', '');
      for (const _douban of Object.keys(global.runningDouban)) {
        const douban = global.runningDouban[_douban];
        if (douban && douban.enableWechatLink) {
          douban.wechatLink('refreshWish', { key });
        }
      }
    }
    if (text.indexOf('想看') === 0) {
      let note = '';
      const doubans = Object.keys(global.runningDouban);
      for (const _douban of doubans) {
        note += doubans.indexOf(_douban) + ': ' + global.runningDouban[_douban].alias + '\n';
      }
      note += '输入豆瓣账户前的序号, 5 分钟内输入有效';
      await global.doubanPush.selectWish(note);
      await redis.setWithExpire('vertex:select:doubans', JSON.stringify(doubans), 300);
    }
    return content;
  }
}
module.exports = WebhookMod;
