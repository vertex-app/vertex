const rss = require('../libs/rss');
const util = require('../libs/util');
const logger = require('../libs/logger');
const CronJob = require('cron').CronJob;
const msgTemplate = require('../libs/msgTemplate');

class Rss {
  constructor (rss, clients) {
    if (!rss.enable) return;
    this.firstTime = global.RFT;
    this.name = rss.taskName;
    this.url = rss.rssUrl;
    this.clients = clients;
    this.client = clients[rss.client];
    this.autoReseed = rss.autoReseed;
    this.onlyReseed = rss.onlyReseed;
    this.skipSameTorrent = rss.skipSameTorrent;
    this.scrapeFree = rss.scrapeFree;
    this.scrapeHr = rss.scrapeHr;
    this.cookie = rss.cookie;
    this.minSize = rss.minSize;
    this.maxSize = rss.maxSize;
    this.savePath = rss.savePath;
    this.category = rss.category;
    this.conditions = rss.conditions;
    this.downloadLimit = rss.speedLimit.download;
    this.uploadLimit = rss.speedLimit.upload;
    this.telegramProxy = this.client.telegramProxy;
    this.rssJob = new CronJob(rss.cron, () => this.rss());
    this.rssJob.start();
  }

  _include (str, keys) {
    if (!keys || keys.length === 0) return true;
    for (const key of keys) {
      if (str.indexOf(key) !== -1) return true;
    }
    return false;
  };

  _exclude (str, keys) {
    if (!keys || keys.length === 0) return true;
    for (const key of keys) {
      if (str.indexOf(key) !== -1) return false;
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

  async _pushTorrent (torrent) {
    if (this.autoReseed && torrent.hash.indexOf('fakehash') === -1) {
      for (const client of this.clients) {
        for (const _torrent of client.maindata.torrents) {
          if (+_torrent.size === +torrent.size && +_torrent.completed === +_torrent.size) {
            const bencodeInfo = await rss.getTorrentNameByBencode(torrent.url);
            if (_torrent.name === bencodeInfo.name && _torrent.hash !== bencodeInfo.hash) {
              await client.addTorrent(this.name, torrent.name, util.formatSize(+torrent.size), torrent.url, _torrent.name, true, this.uploadLimit, this.downloadLimit, _torrent.savePath, this.category);
              await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.name]);
              return;
            }
          }
        }
      }
    }
    if (!this.onlyReseed) {
      if ((this.minSize && this.minSize > parseInt(torrent.size)) || (this.maxSize && this.maxSize < parseInt(torrent.size))) {
        await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.name]);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.name, torrent.name, util.formatSize(torrent.size), 'Size Mismatch'));
        return;
      }
      let serverSpeed;
      if (this.client.sameServerClients) {
        const speed = {
          uploadSpeed: this._sum(this.client.sameServerClients.map(index => this.clients[index].maindata.uploadSpeed)),
          downloadSpeed: this._sum(this.client.sameServerClients.map(index => this.clients[index].maindata.downloadSpeed))
        };
        serverSpeed = Math.sum(speed.uploadSpeed, speed.downloadSpeed);
      } else {
        serverSpeed = Math.max(this.client.maindata.uploadSpeed, this.client.maindata.downloadSpeed);
      }
      if (this.client.maxSpeed && serverSpeed > this.client.maxSpeed) {
        await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.name]);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.name, torrent.name, util.formatSize(torrent.size), `MaxSpeed ${util.formatSize(serverSpeed)}/s`));
        return;
      }
      if (this.scrapeFree) {
        try {
          if (!await util.scrapeFree(torrent.link, this.cookie)) {
            await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.name]);
            await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.name, torrent.name, util.formatSize(torrent.size), 'Not Free'));
            return;
          }
        } catch (e) {
          logger.error('Scrape torrent error: ', e.message);
          await this.telegramProxy.sendMessage(msgTemplate.scrapeErrorString(this.name, torrent.name, e.message));
          return;
        }
      }
      if (this.scrapeHr) {
        try {
          if (await util.scrapeHr(torrent.link, this.cookie)) {
            await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.name]);
            await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.name, torrent.name, util.formatSize(torrent.size), 'HR'));
            return;
          }
        } catch (e) {
          logger.error('Scrape torrent error: ', e.message);
          await this.telegramProxy.sendMessage(msgTemplate.scrapeErrorString(this.name, torrent.name, e.message));
          return;
        }
      }
      if (this.skipSameTorrent) {
        for (const client of this.clients) {
          for (const _torrent of client.maindata.torrents) {
            if (+_torrent.size === +torrent.size && +_torrent.completed !== +_torrent.size) {
              await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.name]);
              await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.name, torrent.name, util.formatSize(torrent.size), 'Skip Same'));
              return;
            }
          }
        }
      }
      await this.client.addTorrent(this.name, torrent.name, util.formatSize(+torrent.size), torrent.url, torrent.name, false, this.uploadLimit, this.downloadLimit, this.savePath, this.category);
      await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.name]);
    }
  }

  async rss () {
    let torrents;
    try {
      torrents = await rss.getTorrents(this.url);
    } catch (error) {
      logger.error('Get rss error: ', error.message);
      await this.telegramProxy.sendMessage(msgTemplate.rssErrorString(this.name, error.message));
      return;
    }
    for (const torrent of torrents) {
      const sqlRes = await util.getRecord('SELECT * FROM torrents WHERE hash = ? AND task_name = ?', [torrent.hash, this.name]);
      if (sqlRes && sqlRes.id) continue;
      if (this.firstTime) {
        await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.name]);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.name, torrent.name, util.formatSize(torrent.size), 'Reject for the first time'));
        continue;
      }
      let fitConditions = true;
      if (!this.conditions || this.conditions.length === 0) {
        await this._pushTorrent(torrent);
        continue;
      }
      for (const condition of this.conditions) {
        if (typeof this['_' + condition.type] !== 'function') {
          logger.error('Illegal Condition Type', condition.type);
        }
        fitConditions = fitConditions && this['_' + condition.type](torrent.name, condition.words);
      }
      if (fitConditions) {
        await this._pushTorrent(torrent);
      } else {
        await util.insertRecord('INSERT INTO torrents (hash, name, task_name) VALUES (?, ?, ?)', [torrent.hash, torrent.name, this.name]);
        await this.telegramProxy.sendMessage(msgTemplate.rejectString(this.name, torrent.name, util.formatSize(torrent.size), 'Keywords Mismatch'));
      }
    }
    this.firstTime = false;
  }
}
module.exports = Rss;
