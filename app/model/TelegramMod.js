const fs = require('fs');
const path = require('path');
const util = require('../libs/util');

class TelegramMod {
  addBot (options) {
    if (!options.alias || !options.token) throw '参数不完整';
    const id = util.uuid.v4().split('-')[0];
    const botSet = {
      id,
      alias: options.alias,
      token: options.token
    };
    fs.writeFileSync(path.join(__dirname, '../data/telegram/bot', id + '.json'), JSON.stringify(botSet, null, 2));
    return '添加 bot 成功';
  };

  addChannel (options) {
    if (!options.alias || !options.channelId) throw '参数不完整';
    const id = util.uuid.v4().split('-')[0];
    const botSet = {
      id,
      alias: options.alias,
      channelId: options.channelId
    };
    fs.writeFileSync(path.join(__dirname, '../data/telegram/channel', id + '.json'), JSON.stringify(botSet, null, 2));
    return '添加频道成功';
  };

  deleteBot (options) {
    fs.unlinkSync(path.join(__dirname, '../data/telegram/bot/', options.id + '.json'));
    return '删除 bot 成功';
  };

  deleteChannel (options) {
    fs.unlinkSync(path.join(__dirname, '../data/telegram/channel/', options.id + '.json'));
    return '删除频道成功';
  };

  modifyBot (options) {
    if (!options.alias || !options.token || !options.id) throw '参数不完整';
    const id = options.id;
    const botSet = {
      id,
      alias: options.alias,
      token: options.token
    };
    fs.writeFileSync(path.join(__dirname, '../data/telegram/bot', id + '.json'), JSON.stringify(botSet, null, 2));
    return '编辑 bot 成功';
  };

  modifyChannel (options) {
    if (!options.alias || !options.channelId || !options.id) throw '参数不完整';
    const id = options.id;
    const botSet = {
      id,
      alias: options.alias,
      channelId: options.channelId
    };
    fs.writeFileSync(path.join(__dirname, '../data/telegram/channel', id + '.json'), JSON.stringify(botSet, null, 2));
    return '编辑频道成功';
  };

  listBot () {
    const botList = util.listBot();
    const clientList = util.listClient();
    const rssList = util.listRss();
    for (const bot of botList) {
      bot.used = clientList.some(item => item.telegram === bot.id);
      bot.used = bot.used || rssList.some(item => item.telegram === bot.id);
    }
    return botList;
  };

  listChannel () {
    const channelList = util.listChannel();
    const clientList = util.listClient();
    const rssList = util.listRss();
    for (const channel of channelList) {
      channel.used = clientList.some(item => item.notifyChannel === channel.id || item.torrentsChannel === channel.id);
      channel.used = channel.used || rssList.some(item => item.notifyChannel === channel.id);
    }
    return channelList;
  };
}

module.exports = TelegramMod;
