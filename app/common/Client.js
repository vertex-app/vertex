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
    this.status = false;
    this.client = clients[client.type];
    this.clientAlias = client.clientAlias;
    this.password = client.password;
    this.username = client.username;
    this.clientUrl = client.clientUrl;
    this.pushMessage = client.pushMessage;
    this.maxSpeed = util.calSize(client.maxSpeed, client.maxSpeedUnit);
    this.maxLeechNum = client.maxLeechNum;
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
    this._deleteRules = client.deleteRules;
    this.deleteRules = util.listDeleteRule().filter(item => client.deleteRules.indexOf(item.id) !== -1);
    if (client.autoDelete) {
      this.autoDeleteJob = new CronJob(client.autoDeleteCron, () => this.autoDelete());
      this.autoDeleteJob.start();
      this.fitTime = {};
      for (const rule of this.deleteRules) {
        if (rule.fitTime) {
          this.fitTime[rule.id] = {};
          rule.fitTimeJob = new CronJob('*/5 * * * * *', () => this.flashFitTime(rule));
          rule.fitTimeJob.start();
        }
      }
    }
    this.recordJob = new CronJob('*/5 * * * *', () => this.record());
    this.recordJob.start();
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

  _fitDeleteRule (_rule, torrent, fitTimeJob) {
    const rule = { ..._rule };
    rule.minDownloadSpeed = util.calSize(rule.minDownloadSpeed, rule.minDownloadSpeedUnit);
    rule.maxDownloadSpeed = util.calSize(rule.maxDownloadSpeed, rule.maxDownloadSpeedUnit);
    rule.minUploadSpeed = util.calSize(rule.minUploadSpeed, rule.minUploadSpeedUnit);
    rule.maxUsedSpace = util.calSize(rule.maxUsedSpace, rule.maxUsedSpaceUnit);
    rule.maxFreeSpace = util.calSize(rule.maxFreeSpace, rule.maxFreeSpaceUnit);
    rule.maxAvgDownloadSpeed = util.calSize(rule.maxAvgDownloadSpeed, rule.maxAvgDownloadSpeedUnit);
    let fit = '1';
    const statusLeeching = ['downloading', 'stalledDL', 'Downloading'];
    const statusSeeding = ['uploading', 'stalledUP', 'Seeding'];
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
    if (rule.maxAvgDownloadSpeed) {
      fit = fit && torrent.completed / (moment().unix() - torrent.addedTime) > +rule.maxAvgDownloadSpeed;
    }
    if (rule.maxSeedTime) {
      fit = fit && (moment().unix() - torrent.completedTime > +rule.maxSeedTime) && statusSeeding.some(item => item === torrent.state);
    }
    if (rule.maxLeechTime) {
      fit = fit && (moment().unix() - torrent.addedTime > +rule.maxLeechTime) && statusLeeching.some(item => item === torrent.state);
    }
    if (rule.maxUsedSpace) {
      fit = fit && (this.maindata.usedSpace > +rule.maxUsedSpace);
    }
    if (rule.maxFreeSpace) {
      fit = fit && (this.maindata.freeSpaceOnDisk < +rule.maxFreeSpace) && statusSeeding.some(item => item === torrent.state);
    }
    if (rule.maxRatio) {
      fit = fit && (torrent.ratio > rule.maxRatio) && statusSeeding.some(item => item === torrent.state);
    }
    if (rule.minRatio) {
      fit = fit && (torrent.ratio < rule.minRatio && ['downloading', 'Downloading'].some(item => item === torrent.state));
    }
    if (rule.maxAvailability) {
      fit = fit && ((torrent.availability || torrent.seeder) > +rule.maxAvailability);
    }
    if (rule.minPeerNum) {
      fit = fit && (torrent.seeder + torrent.leecher) < +rule.minPeerNum;
    }
    if (rule.minProgress) {
      fit = fit && torrent.progress < +rule.minProgress;
    }
    if (rule.maxProgress) {
      fit = fit && torrent.progress > +rule.maxProgress;
    }
    if (rule.excludeCategory) {
      const categories = rule.excludeCategory.split(/\r\n|\n/);
      fit = fit && !categories.some(category => torrent.category === category);
    }
    if (rule.category) {
      const categories = rule.category.split(/\r\n|\n/);
      fit = fit && categories.some(category => torrent.category === category);
    }
    if (!fitTimeJob && rule.fitTime) {
      logger.debug('开始时间:', moment(this.fitTime[rule.id][torrent.hash] * 1000 || 0).format('YYYY-MM-DD HH:mm:ss'), '设置持续时间:', rule.fitTime,
        '删种规则: ', rule.alias, '种子: ', torrent.name);
      fit = fit && (moment().unix() - this.fitTime[rule.id][torrent.hash] > rule.fitTime);
    }
    return fit !== '1' && fit;
  };

  destroy () {
    logger.info('销毁客户端实例', this.clientAlias);
    this.maindataJob.stop();
    if (this.reannounceJob) this.reannounceJob.stop();
    if (this.autoDeleteJob) this.autoDeleteJob.stop();
    for (const rule of this.deleteRules) {
      if (rule.fitTimeJob) {
        rule.fitTimeJob.stop();
      }
    }
    this.recordJob.stop();
    delete global.runningClient[this.id];
  };

  reloadDeleteRule () {
    logger.info('重新加载删种规则', this.clientAlias);
    for (const rule of this.deleteRules) {
      if (rule.fitTimeJob) {
        rule.fitTimeJob.stop();
      }
    }
    this.deleteRules = util.listDeleteRule().filter(item => this._deleteRules.indexOf(item.id) !== -1);
    for (const rule of this.deleteRules) {
      if (rule.fitTime) {
        rule.fitTimeJob = new CronJob('*/5 * * * * *', () => this.flashFitTime(rule));
        rule.fitTimeJob.start();
      }
    }
  }

  createTelegramProxy (telegram, channel) {
    const _telegram = new Telegram(telegram.token, channel, 'HTML', telegram.domain);
    const _this = this;
    const telegramProxy = new Proxy(_telegram, {
      get: function (target, property) {
        if (!_this.pushMessage) {
          logger.debug(_this.clientAlias, '未设置推送消息, 跳过推送');
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
      this.status = true;
      logger.info('客户端', this.clientAlias, '登陆成功');
    } catch (error) {
      logger.error('客户端', this.clientAlias, '登陆失败', error.message);
      await this.telegramProxy.sendMessage(msgTemplate.getCookieErrorString(this.clientAlias, error.message));
      this.status = false;
    }
    try {
      Object.keys(global.runningRss)
        .map(item => global.runningRss[item])
        .filter(item => item.clientId === this.id)
        .forEach((item) => item.reloadClient());
      if (!this.messageId) {
        await this.telegramProxy.sendMessage(msgTemplate.connectClientString(this.clientAlias, moment().format('YYYY-MM-DD HH:mm:ss')));
        const res = await this.channelProxy.sendMessage(msgTemplate.connectClientString(this.clientAlias, moment().format('YYYY-MM-DD HH:mm:ss')));
        if (!this.pushMessage) return;
        this.messageId = res.body.result.message_id;
        await this.channelProxy.deleteMessage(this.messageId - 1);
      }
    } catch (e) {
      logger.info(e);
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
      this.maindata.usedSpace = 0;
      this.maindata.torrents.forEach((item) => {
        this.maindata.usedSpace += item.completed;
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
      logger.debug('客户端', this.clientAlias, '获取种子信息成功');
    } catch (error) {
      logger.error(error);
      logger.error('客户端', this.clientAlias, '获取种子信息失败\n', error.message);
      await this.telegramProxy.sendMessage(msgTemplate.getMaindataErrorString(this.clientAlias, error.message));
      await this.login();
    }
  };

  async addTorrent (taskName, torrentName, size, torrentUrl, torrentReseedName, isSkipChecking = false, uploadLimit = 0, downloadLimit = 0, savePath, category, rule) {
    const { statusCode } = await this.client.addTorrent(this.clientUrl, this.cookie, torrentUrl, isSkipChecking, uploadLimit, downloadLimit, savePath, category);
    if (statusCode !== 200) {
      this.login();
      throw new Error('状态码: ' + statusCode);
    }
    logger.info('客户端', this.clientAlias, '添加种子', torrentName, '成功, 规则:', rule.alias);
    await this.telegramProxy.sendMessage(msgTemplate.addTorrentString(isSkipChecking, taskName, this.clientAlias, torrentName, size, torrentReseedName, rule));
  };

  async reannounceTorrent (hash, torrentName, tracker) {
    try {
      await this.client.reannounceTorrent(this.clientUrl, this.cookie, hash);
      this.reannouncedHash.push(hash);
      logger.info('客户端', this.clientAlias, '重新汇报种子成功:', torrentName);
    } catch (error) {
      logger.error('客户端', this.clientAlias, '重新汇报种子失败:', torrentName, '\n', error.message);
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
      logger.info('客户端', this.clientAlias, '删除种子成功:', torrentName, '规则:', note);
      await this.telegramProxy.sendMessage(
        msgTemplate.deleteTorrentString(this.clientAlias, torrentName, size,
          `${util.formatSize(upload)}/${util.formatSize(download)}`,
          `${util.formatSize(uploadSpeed)}/s /${util.formatSize(downloadSpeed)}/s`, ratio, tracker, isDeleteFiles, note
        ));
    } catch (error) {
      logger.error('客户端', this.clientAlias, '删除种子失败:', torrentName, '\n', error.message);
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
    const torrents = this.maindata.torrents.sort((a, b) => a.completedTime - b.completedTime || a.addedTime - b.addedTime);
    for (const torrent of torrents) {
      for (const rule of this.deleteRules) {
        if (this._fitDeleteRule(rule, torrent)) {
          await this.reannounceTorrent(torrent.hash, torrent.name, torrent.tracker);
          await util.runRecord('update torrents set size = ?, tracker = ?, uploaded = ?, downloaded = ?, delete_time = ? where hash = ?',
            [torrent.size, torrent.tracker, torrent.uploaded, torrent.downloaded, moment().unix(), torrent.hash]);
          await this.deleteTorrent(torrent.hash, torrent.name, torrent.size, torrent.uploaded, torrent.downloaded,
            torrent.uploadSpeed, torrent.downloadSpeed, torrent.ratio, torrent.tracker, '规则: ' + rule.alias);
          return;
        }
      }
    }
  };

  async record () {
    for (const torrent of this.maindata.torrents) {
      await util.runRecord('update torrents set size = ?, tracker = ?, uploaded = ?, downloaded = ? where hash = ?',
        [torrent.size, torrent.tracker, torrent.uploaded, torrent.downloaded, torrent.hash]);
    }
  };

  flashFitTime (rule) {
    if (!this.maindata || !this.maindata.torrents || this.maindata.torrents.length === 0) return;
    try {
      const torrents = this.maindata.torrents.sort((a, b) => a.completedTime - b.completedTime || a.addedTime - b.addedTime);
      for (const torrent of torrents) {
        if (this._fitDeleteRule(rule, torrent, true)) {
          this.fitTime[rule.id][torrent.hash] = this.fitTime[rule.id][torrent.hash] || moment().unix();
        } else {
          delete this.fitTime[rule.id][torrent.hash];
        }
      }
    } catch (e) {
      logger.error('客户端', this.clientAlias, '\n', e);
    }
  }
}
module.exports = Client;
