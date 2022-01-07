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
    this.telegramProxy = this.createTelegramProxy(util.listBot().filter(item => item.id === client.telegram)[0] || {},
      (util.listChannel().filter(item => item.id === client.notifyChannel)[0] || {}).channelId);
    this.channelProxy = this.createTelegramProxy(util.listBot().filter(item => item.id === client.telegram)[0] || {},
      (util.listChannel().filter(item => item.id === client.torrentsChannel)[0] || {}).channelId);
    this.maindataJob = new CronJob(client.cron, () => this.getMaindata());
    this.maindataJob.start();
    if (client.autoReannounce) {
      this.reannouncedHash = [];
      this.reannounceJob = new CronJob('*/10 * * * * *', () => this.autoReannounce());
      this.reannounceJob.start();
    }
    this.deleteRules = util.listDeleteRule().filter(item => client.deleteRules.indexOf(item.id) !== -1);
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
    let fit = '1';
    const statusLeeching = ['downloading', 'stalledDL', 'Downloading'];
    const statusSeeding = ['uploading', 'stalledUP', 'Seeding'];
    logger.debug(rule, torrent);
    if (rule.minUploadSpeed && !rule.maxDownloadSpeed && !rule.minDownloadSpeed) {
      fit = fit && (torrent.uploadSpeed < +rule.minUploadSpeed) && statusSeeding.some(item => item === torrent.state);
    }
    if (rule.maxDownloadSpeed && rule.minUploadSpeed) {
      fit = fit && (torrent.downloadSpeed > +rule.maxDownloadSpeed && torrent.uploadSpeed < +rule.minUploadSpeed);
    }
    if (rule.minDownloadSpeed && rule.minUploadSpeed) {
      fit = fit && (torrent.downloadSpeed < +rule.minDownloadSpeed && torrent.uploadSpeed < +rule.minUploadSpeed &&
        torrent.state !== 'stalledDL' && statusLeeching.some(item => item === torrent.state));
    }
    if (rule.maxSeedTime) {
      fit = fit && (moment().unix() - torrent.completedTime > +rule.maxSeedTime) && statusSeeding.some(item => item === torrent.state);
    }
    if (rule.maxLeechTime) {
      fit = fit && (moment().unix() - torrent.addedTime > +rule.maxLeechTime) && statusLeeching.some(item => item === torrent.state);
    }
    if (rule.maxFreeSpace) {
      fit = fit && (this.maindata.freeSpaceOnDisk < +rule.maxFreeSpace) && statusSeeding.some(item => item === torrent.state);
    }
    if (rule.maxAvailability && torrent.progress < 0.95) {
      fit = fit && (torrent.availability > +rule.maxAvailability);
    }
    if (rule.excludeCategory) {
      const categories = rule.excludeCategory.split(/\r\n|\n/);
      fit = fit && !categories.some(torrent.category);
    }
    if (rule.category) {
      const categories = rule.category.split(/\r\n|\n/);
      fit = fit && categories.some(torrent.category);
    }
    return fit !== '1' && fit;
  };

  destroy () {
    logger.info('Destroying Client', this.id);
    this.maindataJob.stop();
    if (this.reannounceJob) this.reannounceJob.stop();
    if (this.autoDeleteJob) this.autoDeleteJob.stop();
    delete global.runningClient[this.id];
  };

  createTelegramProxy (telegram, channel) {
    const _telegram = new Telegram(telegram.token, channel, 'HTML', telegram.domain);
    const _this = this;
    const telegramProxy = new Proxy(_telegram, {
      get: function (target, property) {
        if (!_this.pushMessage) {
          logger.info(_this.clientAlias, 'pushMessage is false, don\'t send message');
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

  async addTorrent (taskName, torrentName, size, torrentUrl, torrentReseedName, isSkipChecking = false, uploadLimit = 0, downloadLimit = 0, savePath, category, rule) {
    try {
      await this.client.addTorrent(this.clientUrl, this.cookie, torrentUrl, isSkipChecking, uploadLimit, downloadLimit, savePath, category);
      logger.info('Client', this.clientAlias, 'add torrent success');
      await this.telegramProxy.sendMessage(msgTemplate.addTorrentString(isSkipChecking, taskName, this.clientAlias, torrentName, size, torrentReseedName, rule));
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

  async deleteTorrent (hash, torrentName, size, upload, download, uploadSpeed, downloadSpeed, ratio, tracker, note) {
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
          `${util.formatSize(upload)}/${util.formatSize(download)}`,
          `${util.formatSize(uploadSpeed)}/s /${util.formatSize(downloadSpeed)}/s`, ratio, tracker, isDeleteFiles, note
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
      if (now - torrent.addedTime < 300 && now - torrent.addedTime > 60 && (now - torrent.addedTime) % 60 < 10) {
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
            torrent.uploadSpeed, torrent.downloadSpeed, torrent.ratio, torrent.tracker, 'fit rule ' + rule.alias);
          return;
        }
      }
    }
  };
}
module.exports = Client;
