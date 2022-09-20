const crypto = require('crypto');
const util = require('../libs/util');
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

const getAddWishRawObject = function () {
  return {
    view: {
      external_id: 'add_wish' + util.uuid.v4(),
      title: {
        type: 'plain_text',
        text: '添加想看'
      },
      submit: {
        type: 'plain_text',
        text: '提交'
      },
      blocks: [
        {
          type: 'input',
          block_id: 'douban_account',
          element: {
            type: 'static_select',
            options: Object.keys(global.runningDouban).map(item => {
              return {
                text: {
                  type: 'plain_text',
                  text: global.runningDouban[item].alias,
                  emoji: true
                },
                value: global.runningDouban[item].id
              };
            }),
            action_id: 'douban_account'
          },
          label: {
            type: 'plain_text',
            text: '选择订阅任务',
            emoji: true
          }
        }, {
          type: 'input',
          block_id: 'media_name',
          label: {
            type: 'plain_text',
            text: '影视剧名',
            emoji: true
          },
          element: {
            type: 'plain_text_input',
            action_id: 'media_name'
          }
        }
      ],
      type: 'modal'
    }
  };
};

const getSelectMediaRaw = function (result, douban) {
  const sName = global.runningDouban[douban].alias;
  const list = [];
  for (const r of result) {
    logger.info(r);
    list.push({
      type: 'image',
      image_url: r.poster,
      alt_text: r.title
    });
    list.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${r.title}*\n${r.year}`
      }
    });
    list.push({
      type: 'divider'
    });
  }
  return {
    view: {
      external_id: 'select_wish' + util.uuid.v4(),
      private_metadata: douban,
      title: {
        type: 'plain_text',
        text: '选择想看项目'
      },
      submit: {
        type: 'plain_text',
        text: '提交'
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: `订阅任务: ${sName}, 共搜到以下 ${result.length} 个内容`,
            emoji: true
          }
        },
        {
          type: 'divider'
        },
        ...list,
        {
          type: 'input',
          block_id: 'wish_select',
          element: {
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: '选择想看项目',
              emoji: true
            },
            options: result.map(item => {
              return {
                text: {
                  type: 'plain_text',
                  text: item.title,
                  emoji: true
                },
                value: item.id
              };
            }),
            action_id: 'wish_select'
          },
          label: {
            type: 'plain_text',
            text: '选择想看项目',
            emoji: true
          }
        },
        {
          type: 'input',
          block_id: 'tag_select',
          element: {
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: '选择标签',
              emoji: true
            },
            options: Object.keys(global.runningDouban[douban].categories).map(item => {
              return {
                text: {
                  type: 'plain_text',
                  text: item,
                  emoji: true
                },
                value: item
              };
            }),
            action_id: 'tag_select'
          },
          label: {
            type: 'plain_text',
            text: '选择标签',
            emoji: true
          }
        }
      ],
      type: 'modal'
    }
  };
};

const getNoneResultRaw = function () {
  return {
    view: {
      title: {
        type: 'plain_text',
        text: '没有搜索结果',
        emoji: true
      },
      type: 'modal',
      close: {
        type: 'plain_text',
        text: '取消',
        emoji: true
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '没有搜索到结果',
            emoji: true
          }
        }
      ]
    }
  };
};

class WebhookMod {
  async handleSlackShortCuts (id, event) {
    if (id === 'add_wish') {
      const obj = getAddWishRawObject();
      obj.trigger_id = event.trigger_id;
      global.doubanPush.openSlackView(obj);
    }
  }

  /*
  async handelSlackBlockActions (event) {
    if (event.actions[0].action_id === 'search_media') {
      const douban = event.view.state.values.douban_account.douban_account.selected_option.value;
      const text = event.view.state.values.media_name.media_name.value;
      const result = await global.runningDouban[douban].search(text);
      if (result.length === 0) {
        const obj = getNoneResultRaw();
        obj.trigger_id = event.trigger_id;
        await global.doubanPush.openSlackView(obj);
        return '';
      }
      const obj = getSelectMediaRaw();
      obj.trigger_id = event.trigger_id;
      global.doubanPush.openSlackView(obj);
    }
  }
  */

  async handleViewSubmission (event) {
    if (event.view.external_id.indexOf('add_wish') === 0) {
      const douban = event.view.state.values.douban_account.douban_account.selected_option.value;
      const text = event.view.state.values.media_name.media_name.value;
      const result = await global.runningDouban[douban].search(text);
      if (result.length === 0) {
        const obj = getNoneResultRaw();
        obj.trigger_id = event.trigger_id;
        global.doubanPush.openSlackView(obj);
        return;
      }
      const obj = getSelectMediaRaw(result, douban);
      obj.trigger_id = event.trigger_id;
      logger.info(obj);
      global.doubanPush.openSlackView(obj);
    }
    if (event.view.external_id.indexOf('select_wish') === 0) {
      const douban = event.view.private_metadata;
      const id = event.view.state.values.wish_select.wish_select.selected_option.value;
      const tag = event.view.state.values.tag_select.tag_select.selected_option.value;
      (async () => {
        try {
          await global.runningDouban[douban].addWish(id, tag);
        } catch (e) {
          logger.error(e);
          await global.doubanPush.selectWish('添加失败: ' + e.message);
          return '';
        }
        await global.doubanPush.selectWish('添加成功');
        await global.runningDouban[douban].refreshWishList(true);
      })();
      return '';
    }
  }

  async plex (req) {
    if (!req.body) {
      return '服务正常';
    }
    const payload = JSON.parse(req.body.payload);
    if (['media.play', 'media.stop', 'media.resume', 'media.pause', 'media-scrobble', 'library.new'].indexOf(payload.event) !== -1) {
      return await global.webhookPush.pushPlexStartOrStopToSlack(payload);
    }
  }

  async emby (req) {
    logger.info(JSON.parse(req.body.data, null, 2));
    if (!req.body) {
      return '服务正常';
    }
    const payload = JSON.parse(req.body.data);
    if (['media.play', 'media.stop', 'media.resume', 'media.pause', 'media-scrobble', 'media.new'].indexOf(payload.event) !== -1) {
      return await global.webhookPush.pushEmbyStartOrStopToSlack(payload);
    }
  }

  async jellyfin (req) {
    const payload = req.body;
    if (!req.body || !req.query.timestamp || !req.query.nonce) {
      return '服务正常';
    }
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
      return '服务正常';
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
        if (doubans.length === 1) {
          await redis.setWithExpire('vertex:select:douban', doubans[0], 300);
          const _note = '豆瓣账户: ' + global.runningDouban[doubans[0]].alias + '\n' +
            '请输入希望搜索的影视剧名称, 5 分钟内输入有效';
          await global.doubanPush.selectWish(_note);
          return;
        }
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
        if (!movies) {
          await global.doubanPush.selectWish('任务已超时, 退出');
          return '';
        }
        const num = content.xml.SelectedItems[0].SelectedItem[0].OptionIds[0].OptionId[0];
        const movie = movies[num];
        await redis.del('vertex:select:movies');
        if (+num + '' !== num || !movie) {
          await global.doubanPush.selectWish('输入非法, 本次任务已取消');
          return '';
        }
        try {
          await global.runningDouban[movie.doubanId].addWish(movie.id, content.xml.SelectedItems[0].SelectedItem[1].OptionIds[0].OptionId[0]);
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
            option_list: list.slice(0, 10)
          }
        ];
        await global.doubanPush.pushWeChat('Vertex', '本操作只支持企业微信, 仅显示前十个, 普通微信请发送 刷新{剧集名}');
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
        await redis.del('vertex:select:douban');
        return '';
      }
      await redis.del('vertex:select:douban');
      const keys = [];
      for (const [index, value] of result.entries()) {
        await global.doubanPush.pushWeChat(`${index}: ${value.title} - ${value.year}`, '', value.poster);
        keys.push({ id: index, text: `${value.title} - ${value.year}` });
      }
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
        }
      ];
      await global.doubanPush.pushWeChat('Vertex', '企业微信请进行选择\n普通微信请回复\n序号/标签');
      await global.doubanPush.pushWeChatSelector('选择想看', '选择以下项目添加想看项目', selectors, 'selectMedia');
      await redis.setWithExpire('vertex:select:movies', JSON.stringify(result), 300);
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
      if (key === '') {
        await global.doubanPush.selectWish('输入非法, 本次任务已取消');
        return '';
      }
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

  async slack (body) {
    // if ()
    if (body.challenge) {
      return {
        challenge: body.challenge
      };
    }
    if (body.payload) {
      body.event = JSON.parse(body.payload);
    }
    if (!body.event ||
      body.event.subtype === 'bot_message' ||
      body.event.subtype === 'message_deleted') {
      return '';
    }
    const event = body.event;
    if (event.callback_id) {
      return await this.handleSlackShortCuts(event.callback_id, event);
    }
    if (event.type === 'block_actions') {
      return await this.handelSlackBlockActions(event);
    }
    if (event.type === 'view_submission') {
      return await this.handleViewSubmission(event);
    }
    logger.info(event);
    logger.info('收到 Slack 消息:', event.text);
    return event;
  }
}
module.exports = WebhookMod;
