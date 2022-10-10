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
    if (rssSet.enable) global.runningRss[id] = new Rss(rssSet);
    return '添加 Rss 成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/rss/', options.id + '.json'));
    if (global.runningRss[options.id]) global.runningRss[options.id].destroy();
    return '删除 Rss 成功';
  };

  async deleteRecord (options) {
    await util.runRecord('delete from torrents where id = ?', [options.id]);
    return '删除 Rss 记录成功';
  };

  modify (options) {
    const rssSet = { ...options };
    rssSet.sameServerClients = rssSet.sameServerClients || [];
    rssSet.reseedClients = rssSet.reseedClients || [];
    fs.writeFileSync(path.join(__dirname, '../data/rss/', options.id + '.json'), JSON.stringify(rssSet, null, 2));
    if (global.runningRss[options.id]) global.runningRss[options.id].destroy();
    if (rssSet.enable) global.runningRss[options.id] = new Rss(rssSet);
    return '修改 Rss 成功';
  };

  list () {
    const rssList = util.listRss();
    for (const rss of rssList) {
      if (rss.client) {
        rss.clientArr = [rss.client];
        delete rss.client;
      }
      rss.acceptRules = rss.acceptRules || [];
      rss.rejectRules = rss.rejectRules || [];
    }
    return rssList;
  };

  async dryrun (options) {
    const id = util.uuid.v4().split('-')[0];
    const rssSet = { ...options };
    rssSet.id = id;
    rssSet.dryrun = true;
    const rss = new Rss(rssSet);
    const torrents = await rss.dryrun();
    return torrents;
  };

  async mikanSearch (options) {
    const rssList = util.listRss();
    const rssSet = rssList.filter(item => item.id === options.rss)[0];
    rssSet.dryrun = true;
    const rss = new Rss(rssSet);
    const torrents = await rss.mikanSearch(options.name);
    return torrents;
  };

  async mikanPush (options) {
    const rssList = util.listRss();
    const rssSet = rssList.filter(item => item.id === options.rss)[0];
    rssSet.dryrun = true;
    const rss = new Rss(rssSet);
    rss.rss(options.torrents);
    return '任务已开始执行。';
  };
}

module.exports = RssMod;
