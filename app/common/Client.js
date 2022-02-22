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
    this.alarmSpace = util.calSize(client.alarmSpace, client.alarmSpaceUnit);
    this.maxLeechNum = client.maxLeechNum;
    this.sameServerClients = client.sameServerClients;
    this.maindata = null;
    this.maindataJob = new CronJob(client.cron, () => this.getMaindata());
    this.maindataJob.start();
    this.spaceAlarm = client.spaceAlarm;
    this.spaceAlarmJob = new CronJob('*/15 * * * *', () => this.pushSpaceAlarm());
    this.spaceAlarmJob.start();
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

  _fitConditions (_torrent, conditions) {
    let fit = true;
    const torrent = { ..._torrent };
    torrent.ratio = torrent.uploaded / torrent.size;
    torrent.trueRatio = torrent.uploaded / ((torrent.downloaded === 0 && torrent.uploaded !== 0) ? torrent.size : torrent.downloaded);
    torrent.addedTime = moment().unix() - torrent.addedTime;
    torrent.completedTime = moment().unix() - (torrent.completedTime <= 0 ? moment().unix() : torrent.completedTime);
    torrent.freeSpace = this.maindata.freeSpaceOnDisk;
    torrent.secondFromZero = moment().unix() - moment().startOf('day').unix();
    torrent.leechingCount = this.maindata.leechingCount;
    torrent.seedingCount = this.maindata.seedingCount;
    torrent.globalUploadSpeed = this.maindata.uploadSpeed;
    torrent.globalDownloadSpeed = this.maindata.downloadSpeed;
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

  _fitDeleteRule (_rule, torrent, fitTimeJob) {
    const rule = { ..._rule };
    const maindata = { ...this.maindata };
    let fit;
    if (rule.type === 'javascript') {
      try {
        // eslint-disable-next-line no-eval
        fit = (eval(rule.code))(maindata, torrent);
      } catch (e) {
        logger.error('删种规则', this.alias, '存在语法错误\n', e);
        return false;
      }
    } else {
      try {
        fit = rule.conditions.length !== 0 && this._fitConditions(torrent, rule.conditions);
      } catch (e) {
        logger.error('删种规则', this.alias, '遇到错误\n', e);
        return false;
      }
    }
    if (!fitTimeJob && rule.fitTime) {
      if (this.fitTime[rule.id][torrent.hash]) {
        logger.debug('开始时间:', moment(this.fitTime[rule.id][torrent.hash] * 1000 || 0).format('YYYY-MM-DD HH:mm:ss'), '设置持续时间:', rule.fitTime,
          '删种规则: ', rule.alias, '种子: ', torrent.name);
      }
      fit = fit && (moment().unix() - this.fitTime[rule.id][torrent.hash] > rule.fitTime);
    }
    return fit;
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
    let isDeleteFiles = true;
    try {
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
    return isDeleteFiles;
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
    const deletedTorrentHash = [];
    for (const _rule of this.deleteRules) {
      const rule = { ..._rule };
      rule.deleteNum = rule.deleteNum || 1;
      let deletedNum = 0;
      for (const torrent of torrents) {
        if (rule.deleteNum <= deletedNum) {
          logger.debug('规则', rule.alias, ', 单次删除种子数量已达上限', rule.deleteNum, '退出删种任务');
          break;
        }
        if (deletedTorrentHash.indexOf(torrent.hash) !== -1) {
          logger.debug('规则', rule.alias, ', 种子', torrent.name, '已删除', '跳过');
          continue;
        }
        if (this._fitDeleteRule(rule, torrent)) {
          deletedNum += 1;
          await this.reannounceTorrent(torrent);
          logger.info(torrent.name, '重新汇报完毕, 等待 2s');
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
          logger.info(torrent.name, '等待 2s 完毕, 执行删种');
          if (!torrent.tracker || torrent.tracker.indexOf('chdbits') === -1) {
            await util.runRecord('update torrents set size = ?, tracker = ?, uploaded = ?, downloaded = ?, delete_time = ? where hash = ?',
              [torrent.size, torrent.tracker, torrent.uploaded, torrent.downloaded, moment().unix(), torrent.hash]);
          } else {
            await util.runRecord('update torrents set size = ?, tracker = ?, uploaded = ?, downloaded = ?, delete_time = ? where size = ? and link like ?', [torrent.size, torrent.tracker, torrent.uploaded, torrent.downloaded, moment().unix(), torrent.size, '%chdbits%']);
          }
          const deleteFiles = await this.deleteTorrent(torrent, rule);
          deletedTorrentHash.push(torrent.hash);
          if (!deleteFiles) {
            return;
          }
        }
      }
    }
  };

  async record () {
    if (!this.maindata) return;
    for (const torrent of this.maindata.torrents) {
      if (!torrent.tracker || torrent.tracker.indexOf('chdbits') === -1) {
        await util.runRecord('update torrents set size = ?, tracker = ?, uploaded = ?, downloaded = ? where hash = ?',
          [torrent.size, torrent.tracker, torrent.uploaded, torrent.downloaded, torrent.hash]);
      } else {
        await util.runRecord('update torrents set size = ?, tracker = ?, uploaded = ?, downloaded = ? where size = ? and link like ?', [torrent.size, torrent.tracker, torrent.uploaded, torrent.downloaded, torrent.size, '%chdbits%']);
      }
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

  async pushSpaceAlarm () {
    if (!this.spaceAlarm || this.alarmSpace < this.maindata.freeSpaceOnDisk) return;
    try {
      await this.ntf.spaceAlarm(this);
    } catch (e) {
      logger.error('客户端', this.alias, '\n', e);
    }
  }
}
module.exports = Client;
