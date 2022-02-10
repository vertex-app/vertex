const qb = require('../libs/client/qb');
const util = require('../libs/util');
const de = require('../libs/client/de');
const moment = require('moment');
const logger = require('../libs/logger');
const CronJob = require('cron').CronJob;
const Push = require('./Push');

const clients = {
  qBittorrent: qb,
  deluge: de
};

class Client {
  constructor (client) {
    this._client = client;
    this.id = client.id;
    this.status = false;
    this.client = clients[client.type];
    this.alias = client.alias;
    this.password = client.password;
    this.username = client.username;
    this.clientUrl = client.clientUrl;
    this.pushMessage = client.pushMessage;
    this.maxUploadSpeed = util.calSize(client.maxUploadSpeed, client.maxUploadSpeedUnit);
    this.maxDownloadSpeed = util.calSize(client.maxDownloadSpeed, client.maxDownloadSpeedUnit);
    this.minFreeSpace = util.calSize(client.minFreeSpace, client.minFreeSpaceUnit);
    this.maxLeechNum = client.maxLeechNum;
    this.sameServerClients = client.sameServerClients;
    this.maindata = null;
    this.maindataJob = new CronJob(client.cron, () => this.getMaindata());
    this.maindataJob.start();
    this.notify = util.listPush().filter(item => item.id === client.notify)[0] || {};
    this.notify.push = client.pushNotify;
    this.monitor = util.listPush().filter(item => item.id === client.monitor)[0] || {};
    this.monitor.push = client.pushMonitor;
    this.ntf = new Push(this.notify);
    this.mnt = new Push(this.monitor);
    if (client.autoReannounce) {
      this.reannounceJob = new CronJob('*/11 * * * * *', () => this.autoReannounce());
      this.reannounceJob.start();
    }
    this._deleteRules = client.deleteRules;
    this.deleteRules = util.listDeleteRule().filter(item => client.deleteRules.indexOf(item.id) !== -1).sort((a, b) => b.priority - a.priority);
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
    this.errorCount = 0;
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
    const maindata = { ...this.maindata };
    let fit = '1';
    if (rule.type === 'javascript') {
      try {
        // eslint-disable-next-line no-eval
        fit = (eval(rule.code))(maindata, torrent);
      } catch (e) {
        logger.error('删种规则', this.alias, '存在语法错误\n', e);
        return false;
      }
    } else {
      rule.minDownloadSpeed = util.calSize(rule.minDownloadSpeed, rule.minDownloadSpeedUnit);
      rule.maxDownloadSpeed = util.calSize(rule.maxDownloadSpeed, rule.maxDownloadSpeedUnit);
      rule.minUploadSpeed = util.calSize(rule.minUploadSpeed, rule.minUploadSpeedUnit);
      rule.maxUsedSpace = util.calSize(rule.maxUsedSpace, rule.maxUsedSpaceUnit);
      rule.maxFreeSpace = util.calSize(rule.maxFreeSpace, rule.maxFreeSpaceUnit);
      rule.maxAvgDownloadSpeed = util.calSize(rule.maxAvgDownloadSpeed, rule.maxAvgDownloadSpeedUnit);
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
    }
    if (!fitTimeJob && rule.fitTime) {
      if (this.fitTime[rule.id][torrent.hash]) {
        logger.debug('开始时间:', moment(this.fitTime[rule.id][torrent.hash] * 1000 || 0).format('YYYY-MM-DD HH:mm:ss'), '设置持续时间:', rule.fitTime,
          '删种规则: ', rule.alias, '种子: ', torrent.name);
      }
      fit = fit && (moment().unix() - this.fitTime[rule.id][torrent.hash] > rule.fitTime);
    }
    return fit !== '1' && fit;
  };

  destroy () {
    logger.info('销毁客户端实例', this.alias);
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
    logger.info('重新加载删种规则', this.alias);
    for (const rule of this.deleteRules) {
      if (rule.fitTimeJob) {
        rule.fitTimeJob.stop();
      }
    }
    this.deleteRules = util.listDeleteRule().filter(item => this._deleteRules.indexOf(item.id) !== -1).sort((a, b) => +b.priority - +a.priority);
    for (const rule of this.deleteRules) {
      if (rule.fitTime) {
        this.fitTime[rule.id] = {};
        rule.fitTimeJob = new CronJob('*/5 * * * * *', () => this.flashFitTime(rule));
        rule.fitTimeJob.start();
      }
    }
  };

  reloadPush () {
    logger.info('客户端', this.alias, '重新载入推送方式');
    this.notify = util.listPush().filter(item => item.id === this._client.notify)[0] || {};
    this.notify.push = this._client.pushNotify;
    this.monitor = util.listPush().filter(item => item.id === this._client.monitor)[0] || {};
    this.monitor.push = this._client.pushMonitor;
    this.ntf = new Push(this.notify);
    this.mnt = new Push(this.monitor);
  };

  async login () {
    try {
      this.cookie = await this.client.login(this.username, this.clientUrl, this.password);
      this.status = true;
      this.errorCount = 0;
      logger.info('客户端', this.alias, '登陆成功');
    } catch (error) {
      logger.error('客户端', this.alias, '登陆失败\n', error);
      await this.ntf.clientLoginError(this._client, error.message);
      this.status = false;
    }
    try {
      if (!this.messageId) {
        await this.ntf.connectClient(this._client);
        if (this.monitor.push) {
          this.messageId = await this.mnt.connectClient(this._client);
        }
      }
    } catch (e) {
      logger.error(e);
    }
  };

  async getMaindata () {
    if (!this.cookie) {
      this.login();
      return;
    }
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
      /*
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
      */
      logger.debug('客户端', this.alias, '获取种子信息成功');
      this.errorCount = 0;
    } catch (error) {
      logger.error('客户端', this.alias, '获取种子信息失败\n', error);
      this.errorCount += 1;
      if (this.errorCount > 10) {
        await this.ntf.getMaindataError(this._client);
        await this.login();
      }
    }
    try {
      if (this.monitor.push) await this.mnt.edit(this.messageId, this.maindata);
    } catch (e) {
      logger.error('推送监控报错', '\n', e);
    }
  };

  async addTorrent (torrentUrl, isSkipChecking = false, uploadLimit = 0, downloadLimit = 0, savePath, category) {
    const { statusCode } = await this.client.addTorrent(this.clientUrl, this.cookie, torrentUrl, isSkipChecking, uploadLimit, downloadLimit, savePath, category);
    if (statusCode !== 200) {
      this.login();
      throw new Error('状态码: ' + statusCode);
    }
  };

  async reannounceTorrent (torrent) {
    try {
      await this.client.reannounceTorrent(this.clientUrl, this.cookie, torrent.hash);
      logger.info('客户端', this.alias, '重新汇报种子成功:', torrent.name);
    } catch (error) {
      logger.error('客户端', this.alias, '重新汇报种子失败:', torrent.name, '\n', error.message);
      await this.ntf.reannounceTorrent(this._client, torrent);
    }
  };

  async deleteTorrent (torrent, rule) {
    try {
      let isDeleteFiles = true;
      for (const _torrent of this.maindata.torrents) {
        if (_torrent.name === torrent.name && _torrent.size === torrent.size && _torrent.hash !== torrent.hash) {
          isDeleteFiles = false;
        }
      }
      await this.client.deleteTorrent(this.clientUrl, this.cookie, torrent.hash, isDeleteFiles);
      logger.info('客户端', this.alias, '删除种子成功:', torrent.name, rule.alias);
      await this.ntf.deleteTorrent(this._client, torrent, rule, isDeleteFiles);
    } catch (error) {
      logger.error('客户端', this.alias, '删除种子失败:', torrent.name, '\n', error);
      await this.ntf.deleteTorrent(this._client, torrent, rule);
    }
  };

  async autoReannounce () {
    if (!this.maindata) return;
    for (const torrent of this.maindata.torrents) {
      const now = moment().unix();
      if (now - torrent.addedTime < 300 && now - torrent.addedTime > 60 && (now - torrent.addedTime) % 60 < 10) {
        await this.reannounceTorrent(torrent);
      }
    }
  }

  async autoDelete () {
    if (!this.maindata || !this.maindata.torrents || this.maindata.torrents.length === 0) return;
    const torrents = this.maindata.torrents.sort((a, b) => a.completedTime - b.completedTime || a.addedTime - b.addedTime);
    for (const torrent of torrents) {
      for (const rule of this.deleteRules) {
        if (this._fitDeleteRule(rule, torrent)) {
          await this.reannounceTorrent(torrent);
          logger.info(torrent.name, '重新汇报完毕, 等待 5s');
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5000);
          logger.info(torrent.name, '等待 5s 完毕, 执行删种');
          await util.runRecord('update torrents set size = ?, tracker = ?, uploaded = ?, downloaded = ?, delete_time = ? where hash = ?',
            [torrent.size, torrent.tracker, torrent.uploaded, torrent.downloaded, moment().unix(), torrent.hash]);
          await this.deleteTorrent(torrent, rule);
          return;
        }
      }
    }
  };

  async record () {
    if (!this.maindata) return;
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
      logger.error('客户端', this.alias, '\n', e);
    }
  }
}
module.exports = Client;
