const fs = require('fs');
const path = require('path');
const Site = require('../common/Site');
const logger = require('../libs/logger');
const util = require('../libs/util');

class SiteMod {
  add (options) {
    const set = { ...options };
    fs.writeFileSync(path.join(__dirname, '../data/site', set.name + '.json'), JSON.stringify(set, null, 2));
    if (set.enable) global.runningSite[set.name] = new Site(set);
    return '添加站点成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/site', options.name + '.json'));
    if (global.runningSite[options.name]) {
      global.runningSite[options.name].destroy();
    }
    return '删除站点成功';
  };

  modify (options) {
    const set = { ...options };
    fs.writeFileSync(path.join(__dirname, '../data/site', options.name + '.json'), JSON.stringify(set, null, 2));
    if (global.runningSite[options.name]) {
      global.runningSite[options.name].cookie = set.cookie;
      logger.info('站点', set.name, '重新加载 Cookie');
      if (!set.enable) global.runningSite[options.name].destroy();
    }
    return '编辑站点成功';
  };

  list () {
    const siteList = util.listSite();
    for (const site of siteList) {
      site.info = global.runningSite[site.name].info;
    }
    return siteList;
  };

  async refresh (options) {
    if (!options.name) {
      for (const name of Object.keys(global.runningSite)) {
        logger.info('开始刷新站点信息:', name);
        global.runningSite[name].refreshInfo();
      }
      return '刷新任务已执行, 请稍后查看站点信息。';
    } else {
      if (global.runningSite[options.name]) await global.runningSite[options.name].refreshInfo();
      return '刷新成功';
    }
  }
}

module.exports = SiteMod;
