const qb = require('../libs/client/qb');
const util = require('../libs/util');
const de = require('../libs/client/de');
const moment = require('moment');
const logger = require('../libs/logger');
const CronJob = require('cron').CronJob;
const Telegram = require('../libs/telegram');
const msgTemplate = require('../libs/msgTemplate');

const clients = {
  qBittorrent: qb,
  deluge: de
};

class Client {
  constructor (client) {
    this.id = client.id;
    this.client = clients[client.type];
    this.clientAlias = client.clientAlias;
    this.password = client.password;
    this.username = client.username;
    this.clientUrl = client.clientUrl;
    this.pushMessage = client.pushMessage;
    this.maxSpeed = client.maxSpeed;
    this.sameServerClients = client.sameServerClients;
    this.maindata = null;
    this.telegramProxy = this.createTelegramProxy(client, client.notifyChannel);
    this.channelProxy = this.createTelegramProxy(client, client.torrentsChannel);
    this.maindataJob = new CronJob(client.cron, () => this.getMaindata());
    this.maindataJob.start();
    if (client.autoReannounce) {
      this.reannouncedHash = [];
      this.reannounceJob = new CronJob('*/10 * * * * *', () => this.autoReannounce());
      this.reannounceJob.start();
    }
    this.deleteRules = client.deleteRules;
    if (client.autoDelete) {
      this.autoDeleteJob = new CronJob(client.autoDeleteCron, () => this.autoDelete());
      this.autoDeleteJob.start();
    }
    this.messageId = 0;
    this.login();
  };

  _sum (arr) {
    let sum = 0;
    for (const item of arr) {
      sum += item;
    }
    return sum;
  };

  _fitDeleteRule (rule, torrent) {
    let fit = true;
    const statusLeeching = ['downloading', 'stalledDL', 'Downloading'];
    const statusSeeding = ['uploading', 'stalledUP', 'Seeding'];
    if (rule.minUploadSpeed && statusSeeding.some(torrent.state)) {
      fit = fit && (torrent.uploadSpeed < +rule.minUploadSpeed);
    }
    if (rule.maxDownloadSpeed && rule.minUploadSpeed) {
      fit = fit && (torrent.downloadSpeed > +rule.maxDownloadSpeed);
    }
    if (rule.maxSeedTime && statusSeeding.some(torrent.state)) {
      fit = fit && (moment().unix() - torrent.completedTime > +rule.maxSeedTime);
    }
    if (rule.maxLeachTime && statusLeeching.some(torrent.state)) {
      fit = fit && (moment().unix() - torrent.addedTime > +rule.maxLeachTime);
    }
    if (rule.maxFreeSpace && statusSeeding.some(torrent.state)) {
      fit = fit && (this.maindata.freeSpaceOnDisk < +rule.maxFreeSpace);
    }
    if (rule.maxAvailability) {
      fit = fit && (torrent.availability > +rule.maxAvailability && torrent.progress < 0.95);
    }
    if (rule.excludeCategory) {
      const categories = rule.excludeCategory.split('\n');
      fit = fit && !categories.some(torrent.category);
    }
    return !fit;
  };

  destroy () {
    logger.info('Destroying Client', this.id);
    this.maindataJob.stop();
    if (this.reannounceJob) this.reannounceJob.stop();
    if (this.autoDeleteJob) this.autoDeleteJob.stop();
  };

  createTelegramProxy (client, channel) {
    const telegram = new Telegram(client.telegram.botToken, channel, 'HTML', client.telegram.domain);
    const _this = this;
    const telegramProxy = new Proxy(telegram, {
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

  async login () {
    try {
      this.cookie = await this.client.login(this.username, this.clientUrl, this.password);
      logger.info('Client', this.clientAlias, 'login success');
      if (!this.messageId) {
        await this.telegramProxy.sendMessage(msgTemplate.connectClientString(this.clientAlias, moment().format('YYYY-MM-DD HH:mm:ss')));
        const res = await this.channelProxy.sendMessage(msgTemplate.connectClientString(this.clientAlias, moment().format('YYYY-MM-DD HH:mm:ss')));
        if (!this.pushMessage) return;
        this.messageId = res.body.result.message_id;
        await this.channelProxy.deleteMessage(this.messageId - 1);
      }
    } catch (error) {
      logger.error('Client', this.clientAlias, 'login failed', error.message);
      await this.telegramProxy.sendMessage(msgTemplate.getCookieErrorString(this.clientAlias, error.message));
    }
  };

  async getMaindata () {
    if (!this.cookie) return;
    const statusLeeching = ['downloading', 'stalledDL', 'Downloading'];
    const statusSeeding = ['uploading', 'stalledUP', 'Seeding'];
    try {
      this.maindata = await this.client.getMaindata(this.clientUrl, this.cookie);
      this.maindata.leechingCount = 0;
      this.maindata.seedingCount = 0;
      this.maindata.torrents.forEach((item) => {
        if (statusLeeching.indexOf(item.state) !== -1) {
          this.maindata.leechingCount += 1;
        } else if (statusSeeding.indexOf(item.state) !== -1) {
          this.maindata.seedingCount += 1;
        }
      });
      let serverSpeed;
      if (this.sameServerClients) {
        serverSpeed = {
          uploadSpeed: this._sum(this.sameServerClients.map(id => global.runningClient[id].maindata.uploadSpeed)),
          downloadSpeed: this._sum(this.sameServerClients.map(id => global.runningClient[id].maindata.downloadSpeed))
        };
      } else {
        serverSpeed = {
          uploadSpeed: this.maindata.uploadSpeed,
          downloadSpeed: this.maindata.downloadSpeed
        };
      }
      await this.channelProxy.editMessage(this.messageId, msgTemplate.clientInfoString(this.maindata, serverSpeed));
      logger.info('Client', this.clientAlias, 'get maindata success');
    } catch (error) {
      logger.info(error);
      logger.error('Client', this.clientAlias, 'get maindata failed', error.message);
      await this.telegramProxy.sendMessage(msgTemplate.getMaindataErrorString(this.clientAlias, error.message));
      await this.login();
    }
  };

  async addTorrent (taskName, torrentName, size, torrentUrl, torrentReseedName, isSkipChecking = false, uploadLimit = 0, downloadLimit = 0, savePath, category) {
    try {
      await this.client.addTorrent(this.clientUrl, this.cookie, torrentUrl, isSkipChecking, uploadLimit, downloadLimit, savePath, category);
      logger.info('Client', this.clientAlias, 'add torrent success');
      await this.telegramProxy.sendMessage(msgTemplate.addTorrentString(isSkipChecking, taskName, this.clientAlias, torrentName, size, torrentReseedName));
    } catch (error) {
      logger.error('Client', this.clientAlias, 'add torrent failed', error.message);
      await this.telegramProxy.sendMessage(msgTemplate.addTorrentErrorString(taskName, torrentName, size, error.message));
    }
  };

  async reannounceTorrent (hash, torrentName, tracker) {
    try {
      await this.client.reannounceTorrent(this.clientUrl, this.cookie, hash);
      this.reannouncedHash.push(hash);
      logger.info('Client', this.clientAlias, 'reannounce torrent success');
    } catch (error) {
      logger.error('Client', this.clientAlias, 'reannounce torrent failed', error.message);
      await this.telegramProxy.sendMessage(msgTemplate.reannounceErrorString(this.clientAlias, torrentName, tracker, error.message));
    }
  };

  async deleteTorrent (hash, torrentName, size, upload, download, ratio, tracker, note) {
    try {
      let isDeleteFiles = true;
      for (const torrent of this.maindata.torrents) {
        if (torrent.name === torrentName && torrent.size === size && torrent.hash !== hash) {
          isDeleteFiles = false;
        }
      }
      await this.client.deleteTorrent(this.clientUrl, this.cookie, hash, isDeleteFiles);
      logger.info('Client', this.clientAlias, 'delete torrent success');
      await this.telegramProxy.sendMessage(
        msgTemplate.deleteTorrentString(this.clientAlias, torrentName, size,
          `${util.formatSize(upload)}/${util.formatSize(download)}`, ratio, tracker, isDeleteFiles, note
        ));
    } catch (error) {
      logger.error('Client', this.clientAlias, 'delete torrent failed', error.message);
      await this.telegramProxy.sendMessage(msgTemplate.deleteTorrentErrorString(this.clientAlias, torrentName, error.message));
    }
  };

  async autoReannounce () {
    if (!this.maindata) return;
    for (const torrent of this.maindata.torrents) {
      const now = moment().unix();
      if (now - torrent.addedTime > 235 && now - torrent.addedTime < 250) {
        if (this.reannouncedHash.includes(torrent.hash)) return;
        await this.reannounceTorrent(torrent.hash, torrent.name, torrent.tracker);
      }
    }
  }

  async autoDelete () {
    if (!this.maindata || !this.maindata.torrents || this.maindata.torrents.length === 0) return;
    const torrents = this.maindata.torrents.sort((a, b) => a.completedTime - b.completedTime);
    for (const torrent of torrents) {
      for (const rule of this.deleteRules) {
        if (this._fitDeleteRule(rule, torrent)) {
          await this.reannounceTorrent(torrent.hash, torrent.name, torrent.tracker);
          await this.deleteTorrent(torrent.hash, torrent.name, torrent.size, torrent.uploaded, torrent.downloaded,
            torrent.ratio, torrent.tracker, 'fit rule ' + rule.alias);
          return;
        }
      }
    }
  };
}
module.exports = Client;
