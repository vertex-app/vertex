const fs = require('fs');
const path = require('path');
const util = require('../libs/util');

class TelegramMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const set = { ...options };
    set.id = id;
    fs.writeFileSync(path.join(__dirname, '../data/push', id + '.json'), JSON.stringify(set, null, 2));
    return '添加推送工具成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/push', options.id + '.json'));
    return '删除推送工具成功';
  };

  modify (options) {
    const set = { ...options };
    fs.writeFileSync(path.join(__dirname, '../data/push', options.id + '.json'), JSON.stringify(set, null, 2));
    return '编辑推送工具成功';
  };

  list () {
    const pushList = util.listPush();
    const clientList = util.listClient();
    const rssList = util.listRss();
    for (const push of pushList) {
      push.used = clientList.some(item => item.notify === push.id || item.monitor === push.id) ||
        rssList.some(item => item.notify === push.id);
    }
    return pushList;
  };
}

module.exports = TelegramMod;
