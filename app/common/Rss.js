const rss = require('../libs/rss');
const util = require('../libs/util');
const logger = require('../libs/logger');
const CronJob = require('cron').CronJob;
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
    this.autoReseed = rss.autoReseed;
    this.onlyReseed = rss.onlyReseed;
    this.pushMessage = rss.pushMessage;
    this.skipSameTorrent = rss.skipSameTorrent;
    this.scrapeFree = rss.scrapeFree;
    this.scrapeHr = rss.scrapeHr;
    this.cookie = rss.cookie;
    this.savePath = rss.savePath;
    this.category = rss.category;
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
    logger.info('Destroying Rss', this.id);
    this.rssJob.stop();
    delete global.runningRss[this.id];
  }

  reloadClient () {
    logger.info('Reload Client', this.clientId);
    this.clients = global.runningClient;
    this.client = global.runningClient[this.clientId];
  }

  createTelegramProxy (telegram, channel) {
    const _telegram = new Telegram(telegram.token, channel, 'HTML', telegram.domain);
    const _this = this;
    const telegramProxy = new Proxy(_telegram, {
      get: function (target, property) {
        if (!_this.pushMessage) {
          logger.info('pushMessage is false, don\'t send message');
          return () => 1;
        };
        return target[property];
      }
    });
    return telegramProxy;
  };

  async _pushTorrent (torrent, rule) {
    if (this.autoReseed && torrent.hash.indexOf('fakehash') === -1) {
      for (const key of Object.keys(this.clients)) {
        const client = this.clients[key];
        for (const _torrent of client.maindata.torrents) {
          if (+_torrent.size === +torrent.size && +_torrent.completed === +_torrent.size) {
            const bencodeInfo = await rss.getTorrentNameByBencode(torrent.url);
            if (_torrent.name === bencodeInfo.name && _torrent.hash !== bencodeInfo.hash) {
              try {
                await client.addTorrent(this.alias, torrent.name, util.formatSize(+torrent.size), torrent.url, _torrent.name, true, this.uploadLimit, this.downloadLimit, _torrent.savePath, this.category, rule);
                await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.alias]);
                return;
              } catch (error) {
                logger.error('Client', this.clientAlias, 'add torrent failed', error.message);
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
        await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.alias]);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), `MaxSpeed ${util.formatSize(serverSpeed)}/s`));
        return;
      }
      if (this.scrapeFree) {
        try {
          if (!await util.scrapeFree(torrent.link, this.cookie)) {
            await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.alias]);
            await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), 'Not Free'));
            return;
          }
        } catch (e) {
          logger.error('Scrape torrent error: ', e.message);
          await this.telegramProxy.sendMessage(msgTemplate.scrapeErrorString(this.alias, torrent.name, e.message));
          return;
        }
      }
      if (this.scrapeHr) {
        try {
          if (await util.scrapeHr(torrent.link, this.cookie)) {
            await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.alias]);
            await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), 'HR'));
            return;
          }
        } catch (e) {
          logger.error('Scrape torrent error: ', e.message);
          await this.telegramProxy.sendMessage(msgTemplate.scrapeErrorString(this.alias, torrent.name, e.message));
          return;
        }
      }
      if (this.skipSameTorrent) {
        for (const key of Object.keys(this.clients)) {
          const client = this.clients[key];
          for (const _torrent of client.maindata.torrents) {
            if (+_torrent.size === +torrent.size && +_torrent.completed !== +_torrent.size) {
              await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.alias]);
              await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), 'Skip Same'));
              return;
            }
          }
        }
      }
      const fitRules = this.rssRules.filter(item => this._fitRule(item, torrent));
      if (fitRules.length !== 0 || this.rssRules.length === 0) {
        try {
          await this.client.addTorrent(this.alias, torrent.name, util.formatSize(+torrent.size), torrent.url, torrent.name, false, this.uploadLimit, this.downloadLimit, this.savePath, this.category, fitRules[0]);
          await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.alias]);
        } catch (error) {
          logger.error('Client', this.clientAlias, 'add torrent failed', error.message);
          await this.telegramProxy.sendMessage(msgTemplate.addTorrentErrorString(this.alias, torrent.name, util.formatSize(+torrent.size), error.message));
        }
      } else {
        await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.alias]);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), 'No Rules fit'));
      }
    }
  }

  async rss () {
    let torrents;
    try {
      torrents = await rss.getTorrents(this.url);
    } catch (error) {
      logger.error('Get rss error: ', error.message);
      await this.telegramProxy.sendMessage(msgTemplate.rssErrorString(this.alias, error.message));
      return;
    }
    for (const torrent of torrents) {
      const sqlRes = await util.getRecord('SELECT * FROM torrents WHERE hash = ? AND task_name = ?', [torrent.hash, this.alias]);
      if (sqlRes && sqlRes.id) continue;
      if (this.rft) {
        await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.alias]);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), 'Reject for the first time'));
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
        await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.alias]);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.alias, torrent.name, util.formatSize(torrent.size), 'fit rule: ' + unfitRules[0].alias));
      }
    }
    this.rft = false;
  }
}
module.exports = Rss;
