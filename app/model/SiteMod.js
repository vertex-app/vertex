const fs = require('fs');
const path = require('path');
const Site = require('../common/Site');
const logger = require('../libs/logger');
const moment = require('moment');
const util = require('../libs/util');
const OpenApiMod = require('./OpenApiMod');

const openApiMod = new OpenApiMod();

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
      global.runningSite[options.name].adult = set.adult;
      global.runningSite[options.name].cookie = set.cookie;
      global.runningSite[options.name].pullRemoteTorrent = set.pullRemoteTorrent;
      logger.info('站点', set.name, '重新加载 Cookie');
      if (!set.enable) global.runningSite[options.name].destroy();
    } else {
      global.runningSite[set.name] = new Site(set);
    }
    return '编辑站点成功';
  };

  async listRecord () {
    const doubanList = util.listDouban();
    const siteList = util.listSite().filter(i => !!global.runningSite[i.name])
      .map(item => { return { ...item, used: doubanList.filter(i => i.sites.indexOf(item.name) !== -1).length !== 0 }; });
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
          site[time] = site[timeGroup[index - 1]] || { bonus: 0, download: 0, upload: 0, id: 0, level: '', seeding_num: 0, seeding_size: 0 };
        }
      }
    }
    return {
      siteList,
      sites,
      timeGroup
    };
  };

  async list () {
    const doubanList = util.listDouban();
    const siteList = util.listSite()
      .map(item => { return { ...item, used: doubanList.filter(i => i.sites.indexOf(item.name) !== -1).length !== 0, index: global.SITE.siteUrlMap[item.name] }; });
    for (let site of siteList) {
      site = Object.assign(site, global.runningSite[site.name]?.info || {});
    }
    const increase = {
      today: {
        total: {
          upload: 0,
          download: 0
        }
      },
      yesterday: {
        total: {
          upload: 0,
          download: 0
        }
      },
      week: {
        total: {
          upload: 0,
          download: 0
        }
      },
      month: {
        total: {
          upload: 0,
          download: 0
        }
      }
    };
    for (const site of siteList) {
      const sql = 'select * from sites where site = ? and update_time < ? order by update_time desc limit 1';
      const yesterday = (await util.getRecord(sql, [site.name, moment().startOf('day').subtract(1, 'day').unix()])) || {};
      const today = (await util.getRecord(sql, [site.name, moment().startOf('day').unix()])) || {};
      const week = (await util.getRecord(sql, [site.name, moment().startOf('week').unix()])) || {};
      const month = (await util.getRecord(sql, [site.name, moment().startOf('month').unix()])) || {};
      increase.yesterday[site.name] = { upload: today.upload - yesterday.upload || 0, download: today.download - yesterday.download || 0 };
      increase.today[site.name] = { upload: site.upload - today.upload || 0, download: site.download - today.download || 0 };
      increase.week[site.name] = { upload: site.upload - week.upload || 0, download: site.download - week.download || 0 };
      increase.month[site.name] = { upload: site.upload - month.upload || 0, download: site.download - month.download || 0 };
      increase.yesterday.total.upload += today.upload - yesterday.upload || 0;
      increase.yesterday.total.download += today.download - yesterday.download || 0;
      increase.today.total.upload += site.upload - today.upload || 0;
      increase.today.total.download += site.download - today.download || 0;
      increase.week.total.upload += site.upload - week.upload || 0;
      increase.week.total.download += site.download - week.download || 0;
      increase.month.total.upload += site.upload - month.upload || 0;
      increase.month.total.download += site.download - month.download || 0;
    }
    return {
      increase,
      siteList
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

  async pushTorrent (_options) {
    if (!_options.id || _options.id === 'undefined') {
      throw new Error('种子 id 为空!!');
    }
    const options = { ..._options };
    options.savePath = options.savePath.replace('{SITE}', options.site);
    options.category = options.category.replace('{SITE}', options.site);
    const result = await global.runningSite[options.site].pushTorrentById(options.id, options.link, options.downloadLink, options.client, options.savePath, options.category, options.autoTMM, 4, '种子推送');
    return result;
  }

  async listSite (options) {
    if (options.support) {
      return Object.keys(global.SITE.getInfoWrapper);
    }
    const siteList = util.listSite();
    if (options.search) {
      return siteList.filter(item => global.SITE.searchTorrentWrapper[item.name]).map(item => item.name);
    }
    return siteList.map(item => item.name);
  }

  async overview (options) {
    return await openApiMod.siteInfo();
  }
}

module.exports = SiteMod;
