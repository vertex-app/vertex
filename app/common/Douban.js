const util = require('../libs/util');
const moment = require('moment');
const logger = require('../libs/logger');
const CronJob = require('cron').CronJob;
const redis = require('../libs/redis');
const { JSDOM } = require('jsdom');
const Push = require('./Push');
const path = require('path');
const fs = require('fs');

class Douban {
  constructor (douban) {
    this.id = douban.id;
    this.alias = douban.alias;
    this.cookie = douban.cookie;
    this.raceRules = douban.raceRules;
    this.savePath = douban.savePath;
    this.category = douban.category;
    this.autoTMM = douban.autoTMM;
    this.sites = douban.sites;
    this.client = douban.client;
    this.cron = douban.cron;
    this.notify = douban.notify;
    this._notify = util.listPush().filter(i => i.id === this.notify)[0];
    this.push = douban.push;
    this._notify.push = this.push;
    this.ntf = new Push(this._notify);
    this.refreshWishJob = new CronJob(douban.cron, () => this.refreshWish());
    this.refreshWishJob.start();
    this.refreshWish();
    logger.info('豆瓣账号初始化完毕');
  };

  async _getDocument (url) {
    const cache = await redis.get(`vertex:document:body:${url}`);
    if (!cache) {
      const html = (await util.requestPromise({
        url: url,
        headers: {
          cookie: this.cookie
        }
      })).body;
      await redis.setWithExpire(`vertex:document:body:${url}`, html, 30);
      const dom = new JSDOM(html);
      return dom.window.document;
    } else {
      const dom = new JSDOM(cache);
      return dom.window.document;
    }
  };

  destroy () {
    logger.info('销毁豆瓣实例', this.alias);
    this.refreshWishJob.stop();
    delete global.runningClient[this.id];
  };

  async refreshWish () {
    const document = await this._getDocument('https://movie.douban.com/mine?status=wish');
    const items = document.querySelectorAll('.article .grid-view .item');
    const wishes = [];
    for (const item of items) {
      const wish = {};
      wish.name = item.querySelector('li[class=title] em').innerHTML;
      wish.link = item.querySelector('li[class=title] a').href;
      wish.id = wish.link.match(/\/(\d+)\//)[1];
      wishes.push(wish);
    }
    const _doubanSet = util.listDoubanSet().filter(item => item.id === this.id)[0];
    if (!_doubanSet) {
      const doubanSet = {
        id: this.id,
        wishes: wishes.map(item => {
          logger.info('豆瓣账户', this.alias, '首次添加想看列表', item.name, '已设为已下载');
          return { ...item, downloaded: true };
        })
      };
      fs.writeFileSync(path.join(__dirname, '../data/douban/set', this.id + '.json'), JSON.stringify(doubanSet, null, 2));
      await this.ntf.addDouban(this.alias, wishes);
    } else {
      const newWishes = [];
      const doubanSet = { ..._doubanSet };
      for (const wish of wishes) {
        if (!doubanSet.wishes.filter(item => item.id === wish.id)[0]) {
          logger.info('豆瓣账户', this.alias, wish.name, '已添加入想看列表, 稍后将开始自动下载');
          const details = await this._getDocument(wish.link);
          const imdb = details.querySelector('#info').innerHTML.match(/(tt\d+)/);
          wish.imdb = imdb ? imdb[1] : null;
          doubanSet.wishes.push(wish);
          newWishes.push(wish);
        }
      };
      fs.writeFileSync(path.join(__dirname, '../data/douban/set', this.id + '.json'), JSON.stringify(doubanSet, null, 2));
      if (newWishes.length !== 0) {
        await this.ntf.addDoubanWish(this.alias, newWishes);
        await this.selectTorrent(newWishes);
      }
    }
  }

  _fitConditions (_torrent, conditions) {
    let fit = true;
    const torrent = { ..._torrent };
    torrent.time = moment().unix() - torrent.time;
    torrent.tags = torrent.tags.join(',');
    for (const condition of conditions) {
      let value;
      switch (condition.compareType) {
      case 'equals':
        fit = fit && (torrent[condition.key] === condition.value || torrent[condition.key] === +condition.value);
        break;
      case 'bigger':
        value = 1;
        condition.value.split('*').forEach(item => {
          value *= +item;
        });
        fit = fit && torrent[condition.key] > value;
        break;
      case 'smaller':
        value = 1;
        condition.value.split('*').forEach(item => {
          value *= +item;
        });
        fit = fit && torrent[condition.key] < value;
        break;
      case 'contain':
        fit = fit && condition.value.split(',').filter(item => torrent[condition.key].indexOf(item) !== -1).length !== 0;
        break;
      case 'includeIn':
        fit = fit && condition.value.split(',').indexOf(torrent[condition.key]) !== -1;
        break;
      case 'notContain':
        fit = fit && condition.value.split(',').filter(item => torrent[condition.key].indexOf(item) !== -1).length === 0;
        break;
      case 'notIncludeIn':
        fit = fit && condition.value.split(',').indexOf(torrent[condition.key]) === -1;
        break;
      }
    }
    return fit;
  }

  _fitRaceRule (_rule, torrent) {
    const rule = { ..._rule };
    let fit;
    if (rule.type === 'javascript') {
      try {
        // eslint-disable-next-line no-eval
        fit = (eval(rule.code))(torrent);
      } catch (e) {
        logger.error('下载器, ', this.alias, '择剧规则', rule.alias, '存在语法错误\n', e);
        return false;
      }
    } else {
      try {
        fit = rule.conditions.length !== 0 && this._fitConditions(torrent, rule.conditions);
      } catch (e) {
        logger.error('下载器, ', this.alias, '择剧规则', rule.alias, '遇到错误\n', e);
        return false;
      }
    }
    return fit;
  };

  async selectTorrent (wishes) {
    for (const _wish of wishes) {
      const wish = _wish;
      if (!wish.imdb) wish.imdb = wish.name.split('/')[0].trim();
      logger.info(this.alias, '启动豆瓣选剧, 影片:', wish.name, '豆瓣ID:', wish.id, 'imdb:', wish.imdb, '开始搜索以下站点:', this.sites.join(', '));
      const result = await Promise.all(this.sites.map(i => global.runningSite[i].search(wish.imdb)));
      const torrents = result.map(i => i.torrentList).flat();
      logger.info(this.alias, '种子搜索已完成, 共计查找到', torrents.length, '个种子');
      const raceRuleList = util.listRaceRule();
      const raceRules = this.raceRules
        .map(i => raceRuleList.filter(ii => ii.id === i)[0])
        .filter(i => i)
        .sort((a, b) => +b.priority - +a.priority);
      logger.info(this.alias, '择剧规则总计', raceRules.length, ', 开始按照优先级查找');
      for (const rule of raceRules) {
        logger.info(this.alias, '择剧规则:', rule.alias, '开始匹配');
        for (const torrent of torrents) {
          if (this._fitRaceRule(rule, torrent)) {
            logger.info(this.alias, '择剧规则:', rule.alias, ',种子:', torrent.title, '/', torrent.subtitle, '匹配成功, 准备推送至下载器:', global.runningClient[this.client].alias);
            try {
              await global.runningSite[torrent.site].pushTorrentById(torrent.id, torrent.downloadLink, this.client, this.savePath, this.category, this.autoTMM);
            } catch (e) {
              logger.error(this.alias, '择剧规则:', rule.alias, ',种子:', torrent.title, '/', torrent.subtitle, '推送至下载器:', global.runningClient[this.client].alias, '失败, 报错如下:\n', e);
              return await this.ntf.addRaceTorrentError(this.alias, global.runningClient[this.client].alias, torrent, rule.alias);
            }
            logger.info(this.alias, '择剧规则:', rule.alias, ',种子:', torrent.title, '/', torrent.subtitle, '推送至下载器:', global.runningClient[this.client].alias, '成功');
            await this.ntf.addRaceTorrent(this.alias, global.runningClient[this.client].alias, torrent, rule.alias);
            return;
          };
        }
      }
      logger.info(this.alias, '匹配完毕, 没有查找到满足规则的种子');
    }
  }
}
module.exports = Douban;
