const rss = require('../libs/rss');
const util = require('../libs/util');
const logger = require('../libs/logger');
const CronJob = require('cron').CronJob;
const moment = require('moment');
const Push = require('./Push');

class Rss {
  constructor (rss) {
    this._rss = rss;
    this.id = rss.id;
    this.rft = rss.rft;
    this.alias = rss.alias;
    this.url = rss.rssUrl;
    this.clients = global.runningClient;
    this.client = global.runningClient[rss.client];
    this.clientId = rss.client;
    this.clientAlias = this.client.alias;
    this.autoReseed = rss.autoReseed;
    this.onlyReseed = rss.onlyReseed;
    this.reseedClients = rss.reseedClients;
    this.pushMessage = rss.pushMessage;
    this.skipSameTorrent = rss.skipSameTorrent;
    this.scrapeFree = rss.scrapeFree;
    this.scrapeHr = rss.scrapeHr;
    this.sleepTime = rss.sleepTime;
    this.cookie = rss.cookie;
    this.savePath = rss.savePath;
    this.category = rss.category;
    this.notify = util.listPush().filter(item => item.id === rss.notify)[0] || {};
    this.notify.push = rss.pushNotify;
    this.ntf = new Push(this.notify);
    this._rssRules = rss.rssRules;
    this.rssRules = util.listRssRule().filter(item => (rss.rssRules.indexOf(item.id) !== -1));
    this.downloadLimit = util.calSize(rss.downloadLimit, rss.downloadLimitUnit);
    this.uploadLimit = util.calSize(rss.uploadLimit, rss.uploadLimitUnit);
    this.rssJob = new CronJob(rss.cron, () => this.rss());
    this.rssJob.start();
  }

  _all (str, keys) {
    if (!keys || keys.length === 0) return true;
    for (const key of keys) {
      if (str.indexOf(key) === -1) return false;
    }
    return true;
  };

  _sum (arr) {
    let sum = 0;
    for (const item of arr) {
      sum += item;
    }
    return sum;
  }

  _fitRule (rule, torrent) {
    let fit = true;
    if (rule.minSize) {
      fit = fit && torrent.size > util.calSize(rule.minSize, rule.minSizeUnit);
    }
    if (rule.maxSize) {
      fit = fit && torrent.size < util.calSize(rule.maxSize, rule.maxSizeUnit);
    }
    if (rule.includeKeys) {
      fit = fit && this._all(torrent.name, rule.includeKeys.split(/\r\n|\n/));
    }
    if (rule.regExp) {
      const regExp = new RegExp(rule.regExp);
      fit = fit && torrent.name.match(regExp);
    }
    return fit;
  }

  destroy () {
    logger.info('销毁 Rss 实例:', this.alias);
    this.rssJob.stop();
    delete global.runningRss[this.id];
  }

  reloadClient () {
    logger.info('重新载入客户端', this.clientAlias);
    this.clients = global.runningClient;
    this.client = global.runningClient[this.clientId];
  }

  reloadRssRule () {
    logger.info('重新载入 Rss 规则', this.alias);
    this.rssRules = util.listRssRule().filter(item => (this._rssRules.indexOf(item.id) !== -1));
  }

  reloadPush () {
    this.notify = util.listPush().filter(item => item.id === this._rss.notify)[0] || {};
    this.notify.push = this._rss.pushNotify;
    this.ntf = new Push(this.notify);
  }

  async _pushTorrent (torrent) {
    if (this.autoReseed && torrent.hash.indexOf('fakehash') === -1) {
      for (const key of this.reseedClients) {
        const client = this.clients[key];
        if (!client) {
          logger.error('Rss', this.alias, '客户端', key, '不存在');
          continue;
        }
        for (const _torrent of client.maindata.torrents) {
          if (+_torrent.size === +torrent.size && +_torrent.completed === +_torrent.size) {
            const bencodeInfo = await rss.getTorrentNameByBencode(torrent.url);
            if (_torrent.name === bencodeInfo.name && _torrent.hash !== bencodeInfo.hash) {
              try {
                await client.addTorrent(torrent.url, true, this.uploadLimit, this.downloadLimit, _torrent.savePath, this.category);
                await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
                  [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'reseed']);
                await this.ntf.addTorrent(this._rss, this.client, torrent);
                return;
              } catch (error) {
                logger.error(this.alias, '客户端', this.clientAlias, '添加种子', torrent.name, '失败\n', error);
                await this.ntf.addTorrentError(this._rss, this.client, torrent);
              }
            }
          }
        }
      }
    }
    if (!this.onlyReseed) {
      let serverSpeed;
      if (this.client.sameServerClients) {
        const speed = {
          uploadSpeed: this._sum(this.client.sameServerClients.map(index => this.clients[index].maindata.uploadSpeed)),
          downloadSpeed: this._sum(this.client.sameServerClients.map(index => this.clients[index].maindata.downloadSpeed))
        };
        serverSpeed = Math.max(speed.uploadSpeed, speed.downloadSpeed);
      } else {
        serverSpeed = Math.max(this.client.maindata.uploadSpeed, this.client.maindata.downloadSpeed);
      }
      if (this.client.maxSpeed && serverSpeed > this.client.maxSpeed) {
        await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
          [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), '超过客户端最大速度']);
        await this.ntf.rejectTorrent(this._rss, this.client, torrent, `原  因: 超过客户端最大速度 ${util.formatSize(serverSpeed)}/s`);
        return;
      }
      const leechNum = this.client.maindata.torrents.filter(item => ['downloading', 'stalledDL', 'Downloading'].indexOf(item.state) !== -1).length;
      if (this.client.maxLeechNum && leechNum >= this.client.maxLeechNum) {
        await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
          [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), '超过客户端最大下载数量']);
        await this.ntf.rejectTorrent(this._rss, this.client, torrent, `原  因: 超过客户端最大下载数量 ${leechNum}`);
        return;
      }
      if (this.scrapeFree) {
        try {
          if (!await util.scrapeFree(torrent.link, this.cookie)) {
            if (this.sleepTime && (moment().unix() - +this.sleepTime) < torrent.pubTime) {
              logger.info(this.alias, '已设置等待时间', this.sleepTime, ', ', torrent.name, '发布时间为', moment(torrent.pubTime * 1000).format('YYYY-MM-DD HH:mm:ss'), ', 跳过');
            } else {
              await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
                [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), '非免费种']);
            }
            await this.ntf.rejectTorrent(this._rss, this.client, torrent, '原  因: 非免费种');
            return;
          }
        } catch (e) {
          logger.error(this.alias, '抓取免费种子失败: ', e.message);
          await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
            [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), '抓取免费种子失败']);
          await this.ntf.scrapeError(this._rss, torrent);
          return;
        }
      }
      if (this.scrapeHr) {
        try {
          if (await util.scrapeHr(torrent.link, this.cookie)) {
            await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
              [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'hr']);
            await this.ntf.rejectTorrent(this._rss, this.client, torrent, '原  因: HR');
            return;
          }
        } catch (e) {
          logger.error(this.alias, '抓取 HR 种子失败: ', e.message);
          await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
            [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), '抓取 HR 种子失败']);
          await this.ntf.scrapeError(this._rss, torrent);
          return;
        }
      }
      if (this.skipSameTorrent) {
        for (const key of Object.keys(this.clients)) {
          const client = this.clients[key];
          for (const _torrent of client.maindata.torrents) {
            if (+_torrent.size === +torrent.size && +_torrent.completed !== +_torrent.size) {
              await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
                [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), '跳过同大小种子']);
              await this.ntf.rejectTorrent(this._rss, this.client, torrent, '原  因: 跳过同大小种子');
              return;
            }
          }
        }
      }
      const fitRules = this.rssRules.filter(item => this._fitRule(item, torrent));
      if (fitRules.length !== 0 || this.rssRules.length === 0) {
        try {
          await this.client.addTorrent(torrent.url, false, this.uploadLimit, this.downloadLimit, this.savePath, this.category);
          await this.ntf.addTorrent(this._rss, this.client, torrent);
          await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
            [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), '添加']);
        } catch (error) {
          logger.error(this.alias, '客户端', this.clientAlias, '添加种子失败:', error.message);
          await this.ntf.addTorrentError(this._rss, this.client, torrent);
        }
      } else {
        await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
          [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), '不符合所有规则']);
        await this.ntf.rejectTorrent(this._rss, this.client, torrent, '原  因: 不符合所有规则');
      }
    }
  }

  async rss () {
    let torrents;
    try {
      torrents = await rss.getTorrents(this.url);
    } catch (error) {
      logger.error(this.alias, '获取 Rss 列表失败\n', error);
      await this.ntf.rssError(this._rss);
      return;
    }
    for (const torrent of torrents) {
      const sqlRes = await util.getRecord('SELECT * FROM torrents WHERE hash = ? AND rss_name = ?', [torrent.hash, this.alias]);
      if (sqlRes && sqlRes.id) continue;
      if (this.rft) {
        await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
          [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), '跳过第一次添加种子']);
        await this.ntf.rejectTorrent(this._rss, this.client, torrent, '原  因: 跳过第一次添加种子');
        continue;
      }
      const excludeKeysRules = this.rssRules.filter(item => item.excludeKeys);
      if (excludeKeysRules.length === 0) {
        await this._pushTorrent(torrent);
        continue;
      }
      const unfitRules = excludeKeysRules.filter(item => this._all(torrent.name, item.excludeKeys.split(/\r\n|\n/)));
      if (unfitRules.length === 0) {
        await this._pushTorrent(torrent);
      } else {
        await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
          [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), '匹配到关键词']);
        await this.ntf.rejectTorrent(this._rss, this.client, torrent, `原  因: 匹配到规则 ${unfitRules[0].alias}`);
      }
    }
    this.rft = false;
  }
}
module.exports = Rss;
