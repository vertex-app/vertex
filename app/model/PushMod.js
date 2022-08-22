const fs = require('fs');
const path = require('path');
const util = require('../libs/util');

class PushMod {
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
    const clientList = util.listClient();
    const rssList = util.listRss();
    const doubanList = util.listDouban();
    fs.writeFileSync(path.join(__dirname, '../data/push', options.id + '.json'), JSON.stringify(set, null, 2));
    clientList.filter(item => item.notify === set.id || item.monitor === set.id)
      .filter(item => !!global.runningClient[item.id])
      .forEach(item => global.runningClient[item.id].reloadPush());
    rssList.filter(item => item.notify === set.id)
      .filter(item => !!global.runningRss[item.id])
      .forEach(item => global.runningRss[item.id].reloadPush());
    doubanList.filter(item => item.notify === set.id)
      .filter(item => !!global.runningDouban[item.id])
      .forEach(item => global.runningDouban[item.id].reloadPush());
    return '编辑推送工具成功';
  };

  list () {
    const pushList = util.listPush();
    const clientList = util.listClient();
    const doubanList = util.listDouban();
    const watchList = util.listWatch();
    const rssList = util.listRss();
    for (const push of pushList) {
      push.used = clientList.some(item => item.notify === push.id || item.monitor === push.id) ||
        rssList.some(item => item.notify === push.id) ||
        doubanList.some(item => item.notify === push.id) ||
        watchList.some(item => item.notify === push.id);
    }
    return pushList;
  };
}

module.exports = PushMod;
