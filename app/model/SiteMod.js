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

  async list () {
    const siteList = util.listSite().filter(i => !!global.runningSite[i.name]);
    for (let site of siteList) {
      site = Object.assign(site, global.runningSite[site.name].info);
    }
    const _sites = siteList.map(i => i.name).join('\', \'');
    const records = await util.getRecords(`select * from sites where site in ('${_sites}')`);
    const timeGroup = (await util.getRecords(`select update_time from sites where site in ('${_sites}') group by update_time`)).map(i => i.update_time);
    const sites = {};
    for (const record of records) {
      if (!sites[record.site]) sites[record.site] = {};
      sites[record.site][record.update_time] = record;
    }
    for (const _site of Object.keys(sites)) {
      const site = sites[_site];
      for (const [index, time] of timeGroup.entries()) {
        if (!site[time]) {
          site[time] = site[timeGroup[index - 1]] || 0;
        }
      }
    }
    return {
      siteList,
      sites,
      timeGroup
    };
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

  async search (options) {
    if (!options.keyword) {
      throw new Error('请输入关键词后搜索!!');
    }
    const sites = JSON.parse(options.sites || '[]');
    let searchSites;
    if (!sites) {
      searchSites = Object.keys(global.runningSite);
    } else {
      searchSites = sites;
    }
    const result = await Promise.all(searchSites.map(i => global.runningSite[i].search(options.keyword)));
    return result;
  }

  async pushTorrent (options) {
    if (!options.id || options.id === 'undefined') {
      throw new Error('种子 id 为空!!');
    }
    const result = await global.runningSite[options.site].pushTorrentById(options.id, options.downloadLink, options.client, options.savePath, options.category, options.autoTMM, 4, '种子推送');
    return result;
  }
}

module.exports = SiteMod;
