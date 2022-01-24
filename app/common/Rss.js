const rss = require('../libs/rss');
const util = require('../libs/util');
const logger = require('../libs/logger');
const CronJob = require('cron').CronJob;
const moment = require('moment');
const Telegram = require('../libs/telegram');
const msgTemplate = require('../libs/msgTemplate');

class Rss {
  constructor (rss) {
    this.id = rss.id;
    this.rft = rss.rft;
    this.alias = rss.alias;
    this.url = rss.rssUrl;
    this.clients = global.runningClient;
    this.client = global.runningClient[rss.client];
    this.clientId = rss.client;
    this.clientAlias = this.client.clientAlias;
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
    this._rssRules = rss.rssRules;
    this.rssRules = util.listRssRule().filter(item => (rss.rssRules.indexOf(item.id) !== -1));
    this.downloadLimit = util.calSize(rss.downloadLimit, rss.downloadLimitUnit);
    this.uploadLimit = util.calSize(rss.uploadLimit, rss.uploadLimitUnit);
    this.telegramProxy = this.createTelegramProxy(util.listBot().filter(item => item.id === rss.telegram)[0] || {},
      (util.listChannel().filter(item => item.id === rss.notifyChannel)[0] || {}).channelId);
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

  createTelegramProxy (telegram, channel) {
    const _telegram = new Telegram(telegram.token, channel, 'HTML', telegram.domain);
    const _this = this;
    const telegramProxy = new Proxy(_telegram, {
      get: function (target, property) {
        if (!_this.pushMessage) {
          logger.info(this.alias, '未设置推送消息, 跳过推送');
          return () => 1;
        };
        return target[property];
      }
    });
    return telegramProxy;
  };

  async _pushTorrent (torrent, rule) {
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
                await client.addTorrent(this.alias, torrent.name, util.formatSize(+torrent.size), torrent.url, _torrent.name, true, this.uploadLimit, this.downloadLimit, _torrent.savePath, this.category, rule || {});
                await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
                  [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'reseed']);
                return;
              } catch (error) {
                logger.error(this.alias, '客户端', this.clientAlias, '添加种子失败: ', error.message);
                await this.telegramProxy.sendMessage(msgTemplate.addTorrentErrorString(this.alias, torrent.name, util.formatSize(+torrent.size), error.message));
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
          [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'reject max speed']);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), `MaxSpeed ${util.formatSize(serverSpeed)}/s`));
        return;
      }
      const leechNum = this.client.maindata.torrents.filter(item => ['downloading', 'stalledDL', 'Downloading'].indexOf(item.state) !== -1).length;
      if (this.client.maxLeechNum && leechNum >= this.client.maxLeechNum) {
        await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
          [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'reject max leech num']);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), `MaxLeechNum ${leechNum}`));
        return;
      }
      if (this.scrapeFree) {
        try {
          if (!await util.scrapeFree(torrent.link, this.cookie)) {
            await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
              [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'not free']);
            await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), 'Not Free'));
            return;
          }
        } catch (e) {
          logger.error(this.alias, '抓取免费种子失败: ', e.message);
          await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
            [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'not free']);
          await this.telegramProxy.sendMessage(msgTemplate.scrapeErrorString(this.alias, torrent.name, e.message));
          return;
        }
      }
      if (this.scrapeHr) {
        try {
          if (await util.scrapeHr(torrent.link, this.cookie)) {
            await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
              [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'hr']);
            await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), 'HR'));
            return;
          }
        } catch (e) {
          logger.error(this.alias, '抓取 HR 种子失败: ', e.message);
          await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
            [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'not free']);
          await this.telegramProxy.sendMessage(msgTemplate.scrapeErrorString(this.alias, torrent.name, e.message));
          return;
        }
      }
      if (this.skipSameTorrent) {
        for (const key of Object.keys(this.clients)) {
          const client = this.clients[key];
          for (const _torrent of client.maindata.torrents) {
            if (+_torrent.size === +torrent.size && +_torrent.completed !== +_torrent.size) {
              await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
                [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'skip same']);
              await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), 'Skip Same'));
              return;
            }
          }
        }
      }
      const fitRules = this.rssRules.filter(item => this._fitRule(item, torrent));
      if (fitRules.length !== 0 || this.rssRules.length === 0) {
        try {
          await this.client.addTorrent(this.alias, torrent.name, util.formatSize(+torrent.size), torrent.url, torrent.name, false, this.uploadLimit, this.downloadLimit, this.savePath, this.category, fitRules[0] || {});
          await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
            [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'add']);
        } catch (error) {
          logger.error(this.alias, '客户端', this.clientAlias, '添加种子失败:', error.message);
          await this.telegramProxy.sendMessage(msgTemplate.addTorrentErrorString(this.alias, torrent.name, util.formatSize(+torrent.size), error.message));
        }
      } else {
        await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
          [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'no rule fit']);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), 'No Rules fit'));
      }
    }
  }

  async rss () {
    let torrents;
    try {
      torrents = await rss.getTorrents(this.url);
    } catch (error) {
      logger.error(this.alias, '获取 Rss 列表失败: ', error.message);
      await this.telegramProxy.sendMessage(msgTemplate.rssErrorString(this.alias, error.message));
      return;
    }
    for (const torrent of torrents) {
      const sqlRes = await util.getRecord('SELECT * FROM torrents WHERE hash = ? AND rss_name = ?', [torrent.hash, this.alias]);
      if (sqlRes && sqlRes.id) continue;
      if (this.rft) {
        await util.runRecord('INSERT INTO torrents (hash, name, rss_name, link, add_time, insert_type) values (?, ?, ?, ?, ?, ?)',
          [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'rft']);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), '跳过第一次添加种子'));
        continue;
      }
      if (this.sleepTime && (moment().unix() - +this.sleepTime) < torrent.pubTime) {
        logger.info(this.alias, '已设置等待时间', this.sleepTime, ', ', torrent.name, '发布时间为', moment(torrent.pubTime * 1000).format('YYYY-MM-DD HH:mm:ss'), ', 跳过');
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
          [torrent.hash, torrent.name, this.alias, torrent.link, moment().unix(), 'reject fit keyword']);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), 'fit rule: ' + unfitRules[0].alias));
      }
    }
    this.rft = false;
  }
}
module.exports = Rss;
