const fs = require('fs');
const path = require('path');
const Rss = require('../common/Rss');

const util = require('../libs/util');
class RssMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const rssSet = { ...options };
    rssSet.id = id;
    fs.writeFileSync(path.join(__dirname, '../data/rss/', id + '.json'), JSON.stringify(rssSet, null, 2));
    if (global.runningRss[id]) global.runningRss[id].destory();
    global.runningRss[id] = new Rss(rssSet);
    return '添加 Rss 成功';
  };

  delete (options) {
  };

  modify (options) {
    const clientSet = { ...options };
    clientSet.deleteRules = clientSet.deleteRules || [];
    clientSet.sameServerClients = clientSet.sameServerClients || [];
    fs.writeFileSync(path.join(__dirname, '../data/client/', options.id + '.json'), JSON.stringify(clientSet, null, 2));
    return '修改 Rss 成功';
  };

  list () {
    const rssList = util.listRss();
    return rssList;
  };
}

module.exports = RssMod;
