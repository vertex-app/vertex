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
    if (global.runningRss[id]) global.runningRss[id].destroy();
    global.runningRss[id] = new Rss(rssSet);
    return '添加 Rss 成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/rss/', options.id + '.json'));
    if (global.runningRss[options.id]) global.runningRss[options.id].destroy();
    return '删除 Rss 成功';
  };

  modify (options) {
    const rssSet = { ...options };
    rssSet.deleteRules = rssSet.deleteRules || [];
    rssSet.sameServerClients = rssSet.sameServerClients || [];
    rssSet.reseedClients = rssSet.reseedClients || [];
    fs.writeFileSync(path.join(__dirname, '../data/rss/', options.id + '.json'), JSON.stringify(rssSet, null, 2));
    if (global.runningRss[options.id]) global.runningRss[options.id].destroy();
    if (rssSet.enable) global.runningRss[options.id] = new Rss(rssSet);
    return '修改 Rss 成功';
  };

  list () {
    const rssList = util.listRss();
    return rssList;
  };
}

module.exports = RssMod;
