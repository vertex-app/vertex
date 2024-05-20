const qb = require('../libs/client/qb');
const util = require('../libs/util');
const de = require('../libs/client/de');
const tr = require('../libs/client/tr');
const redis = require('../libs/redis');
const moment = require('moment');
const logger = require('../libs/logger');
const cron = require('node-cron');
const Push = require('./Push');

const clients = {
  qBittorrent: qb,
  deluge: de,
  Transmission: tr
};

class Client {
  constructor (client) {
    this._client = client;
    this.id = client.id;
    this.status = false;
    this.client = clients[client.type];
    this.alias = client.alias;
    this.firstLastPiecePrio = client.firstLastPiecePrio || false;
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
    this.maindataJob = cron.schedule(client.cron, () => this.getMaindata());
    this.spaceAlarm = client.spaceAlarm;
    this.spaceAlarmJob = cron.schedule('*/15 * * * *', () => this.pushSpaceAlarm());
    this.notify = util.listPush().filter(item => item.id === client.notify)[0] || {};
    this.notify.push = client.pushNotify;
    this.monitor = util.listPush().filter(item => item.id === client.monitor)[0] || {};
    this.monitor.push = client.pushMonitor;
    this.ntf = new Push(this.notify);
    this.mnt = new Push(this.monitor);
    if (client.type === 'qBittorrent' && client.autoReannounce) {
      this.reannounceJob = cron.schedule('3 * * * * *', () => this.autoReannounce());
    }
    this.reannouncedHash = [];
    this._deleteRules = client.deleteRules;
    this.deleteRules = util.listDeleteRule().filter(item => this._deleteRules.indexOf(item.id) !== -1).sort((a, b) => b.priority - a.priority);
    this._rejectDeleteRules = client.rejectDeleteRules || [];
    this.rejectDeleteRules = util.listDeleteRule().filter(item => this._rejectDeleteRules.indexOf(item.id) !== -1).sort((a, b) => b.priority - a.priority);
    if (client.autoDelete) {
      this.autoDeleteJob = cron.schedule(client.autoDeleteCron, () => this.autoDelete());
      this.fitTime = {};
      for (const rule of this.deleteRules) {
        if (rule.fitTime) {
          this.fitTime[rule.id] = {};
          rule.fitTimeJob = cron.schedule('*/5 * * * * *', () => this.flashFitTime(rule));
        }
      }
    }
    this.recordJob = cron.schedule('20 */5 * * * *', () => this.record());
    if (client.type === 'qBittorrent') {
      this.trackerSyncJob = cron.schedule('*/5 * * * *', () => this.trackerSync());
    }
    this.messageId = 0;
    this.errorCount = 0;
    this.trackerStatus = {};
    this.pausedTorrentHashes = [];
    this.getMaindata();
    this.avgUploadSpeed = 0;
    this.avgDownloadSpeed = 0;
    this.lastCookie = 0;
    logger.info('下载器', this.alias, '初始化完毕');
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
    torrent.ratio3 = torrent.uploaded / torrent.totalSize;
    torrent.addedTime = moment().unix() - torrent.addedTime;
    torrent.completedTime = moment().unix() - (torrent.completedTime <= 0 ? moment().unix() : torrent.completedTime);
    torrent.freeSpace = this.maindata.freeSpaceOnDisk;
    torrent.secondFromZero = moment().unix() - moment().startOf('day').unix();
    torrent.leechingCount = this.maindata.leechingCount;
    torrent.seedingCount = this.maindata.seedingCount;
    torrent.globalUploadSpeed = this.avgUploadSpeed;
    torrent.globalDownloadSpeed = this.avgDownloadSpeed;
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
      case 'regExp':
        fit = fit && (torrent[condition.key] + '').match(new RegExp(condition.value));
        break;
      case 'notRegExp':
        fit = fit && !(torrent[condition.key] + '').match(new RegExp(condition.value));
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
        logger.error('下载器, ', this.alias, '删种规则', rule.alias, '存在语法错误\n', e);
        return false;
      }
    } else {
      try {
        fit = rule.conditions.length !== 0 && this._fitConditions(torrent, rule.conditions);
      } catch (e) {
        logger.error('下载器, ', this.alias, '删种规则', rule.alias, '遇到错误\n', e);
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
    logger.info('销毁下载器实例', this.alias);
    this.maindataJob.stop();
    delete this.maindataJob;
    if (this.trackerSyncJob) {
      this.trackerSyncJob.stop();
      delete this.trackerSyncJob;
    }
    if (this.reannounceJob) {
      this.reannounceJob.stop();
      delete this.reannounceJob;
    }
    if (this.autoDeleteJob) {
      this.autoDeleteJob.stop();
      delete this.autoDeleteJob;
    }
    if (this.spaceAlarmJob) {
      this.spaceAlarmJob.stop();
      delete this.spaceAlarmJob;
    }
    for (const rule of this.deleteRules) {
      if (rule.fitTimeJob) {
        rule.fitTimeJob.stop();
        delete rule.fitTimeJob;
      }
    }
    this.recordJob.stop();
    delete this.recordJob;
    delete global.runningClient[this.id];
  };

  reloadDeleteRule () {
    logger.info('重新加载删种规则', this.alias);
    for (const rule of this.deleteRules) {
      if (rule.fitTimeJob) {
        rule.fitTimeJob.stop();
        delete rule.fitTimeJob;
      }
    }
    this.deleteRules = util.listDeleteRule().filter(item => this._deleteRules.indexOf(item.id) !== -1).sort((a, b) => +b.priority - +a.priority);
    this.rejectDeleteRules = util.listDeleteRule().filter(item => this._rejectDeleteRules.indexOf(item.id) !== -1).sort((a, b) => b.priority - a.priority);
    for (const rule of this.deleteRules) {
      if (rule.fitTime) {
        this.fitTime[rule.id] = {};
        rule.fitTimeJob = cron.schedule('*/5 * * * * *', () => this.flashFitTime(rule));
      }
    }
  };

  reloadPush () {
    logger.info('下载器', this.alias, '重新载入推送方式');
    this.notify = util.listPush().filter(item => item.id === this._client.notify)[0] || {};
    this.notify.push = this._client.pushNotify;
    this.monitor = util.listPush().filter(item => item.id === this._client.monitor)[0] || {};
    this.monitor.push = this._client.pushMonitor;
    this.ntf = new Push(this.notify);
    this.mnt = new Push(this.monitor);
    this.login();
  };

  async login (notify = true) {
    try {
      this.cookie = await this.client.login(this.username, this.clientUrl, this.password);
      this.status = true;
      this.errorCount = 0;
      this.lastCookie = moment().unix();
      logger.info('下载器', this.alias, '登录成功');
    } catch (error) {
      logger.error('下载器', this.alias, '登录失败\n', error);
      await this.ntf.clientLoginError(this._client, error.message);
      this.status = false;
      this.maindata = null;
      return;
    }
    try {
      if (!this.messageId && notify) {
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
    if (this.lastCookie < moment().unix() - 3000) {
      this.login(false);
      return;
    }
    const statusLeeching = ['downloading', 'stalledDL', 'Downloading'];
    const statusSeeding = ['uploading', 'stalledUP', 'Seeding'];
    try {
      const maindata = await this.client.getMaindata(this.clientUrl, this.cookie);
      if (typeof maindata === 'string') {
        this.cookie.sessionId = maindata;
        return;
      }
      this.maindata = maindata;
      this.maindata.leechingCount = 0;
      this.maindata.seedingCount = 0;
      this.maindata.usedSpace = 0;
      this.maindata.torrents.forEach((item) => {
        item.trackerStatus = this.trackerStatus[item.hash] || '';
        this.maindata.usedSpace += item.completed;
        if (statusLeeching.indexOf(item.state) !== -1) {
          this.maindata.leechingCount += 1;
        } else if (statusSeeding.indexOf(item.state) !== -1) {
          this.maindata.seedingCount += 1;
        }
      });
      this.avgDownloadSpeed = maindata.downloadSpeed * 0.1 + this.avgDownloadSpeed * 0.9;
      this.avgUploadSpeed = maindata.uploadSpeed * 0.1 + this.avgUploadSpeed * 0.9;
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
      logger.debug('下载器', this.alias, '获取种子信息成功');
      this.status = true;
      this.errorCount = 0;
    } catch (error) {
      logger.error('下载器', this.alias, '获取种子信息失败\n', error);
      this.status = false;
      this.maindata = null;
      this.errorCount += 1;
      if (this.errorCount > 5) {
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

  async addTorrent (torrentUrl, hash, isSkipChecking = false, uploadLimit = 0, downloadLimit = 0, savePath, category, autoTMM, paused) {
    if (!this.status) {
      throw new Error('客户端' + this.alias + '当前状态为不可用');
    }
    const { statusCode } = await this.client.addTorrent(this.clientUrl, this.cookie, torrentUrl, isSkipChecking, uploadLimit, downloadLimit, savePath, category, autoTMM, this.firstLastPiecePrio, paused);
    if (statusCode !== 200) {
      this.login();
      throw new Error('状态码: ' + statusCode);
    }
    if (this.maindata) {
      this.maindata.leechingCount += 1;
    }
    await util.runRecord('insert into torrent_flow (hash, upload, download, time) values (?, ?, ?, ?)',
      [hash, 0, 0, moment().unix() - moment().unix() % 300]);
  };

  async addTorrentTag (hash, tag) {
    if (this._client.type === 'qBittorrent') {
      await this.client.addTorrentTag(this.clientUrl, this.cookie, hash, tag);
    }
  }

  async addTorrentByTorrentFile (filepath, hash, isSkipChecking = false, uploadLimit = 0, downloadLimit = 0, savePath, category, autoTMM, paused) {
    const { statusCode } = await this.client.addTorrentByTorrentFile(this.clientUrl, this.cookie, filepath, isSkipChecking, uploadLimit, downloadLimit, savePath, category, autoTMM, this.firstLastPiecePrio, paused);
    if (statusCode !== 200) {
      this.login();
      throw new Error('状态码: ' + statusCode);
    }
    if (this.maindata) {
      this.maindata.leechingCount += 1;
    }
    await util.runRecord('insert into torrent_flow (hash, upload, download, time) values (?, ?, ?, ?)',
      [hash, 0, 0, moment().unix() - moment().unix() % 300]);
  };

  async reannounceTorrent (torrent) {
    try {
      await this.client.reannounceTorrent(this.clientUrl, this.cookie, torrent.hash);
      logger.info('下载器', this.alias, '重新汇报种子成功:', torrent.name);
      this.ntf.reannounceTorrent(this._client, torrent);
    } catch (error) {
      logger.error('下载器', this.alias, '重新汇报种子失败:', torrent.name, '\n', error.message);
      this.ntf.reannounceTorrentError(this._client, torrent);
    }
  };

  async deleteTorrent (torrent, rule) {
    let isDeleteFiles = true;
    try {
      for (const _torrent of this.maindata.torrents) {
        if (_torrent.name === torrent.name && _torrent.size === torrent.size && _torrent.hash !== torrent.hash && _torrent.savePath === torrent.savePath) {
          isDeleteFiles = false;
        }
      }
      if (rule.onlyDeleteTorrent) {
        isDeleteFiles = false;
      }
      if (rule.limitSpeed) {
        await this.setSpeedLimit(torrent.hash, 'download', rule.limitSpeed);
        this.pausedTorrentHashes.push(torrent.hash);
      } else if (rule.pause) {
        await this.pauseTorrent(torrent.hash);
        this.pausedTorrentHashes.push(torrent.hash);
      } else {
        await this.client.deleteTorrent(this.clientUrl, this.cookie, torrent.hash, isDeleteFiles);
      }
      logger.info('下载器', this.alias, '删除种子成功:', torrent.name, rule.alias);
      await this.ntf.deleteTorrent(this._client, torrent, rule, isDeleteFiles);
    } catch (error) {
      logger.error('下载器', this.alias, '删除种子失败:', torrent.name, '\n', error);
      await this.ntf.deleteTorrentError(this._client, torrent, rule);
    }
    return isDeleteFiles;
  };

  async autoReannounce () {
    if (!this.maindata) return;
    logger.debug(this.alias, moment().format(), '启动重新汇报任务');
    for (const torrent of this.maindata.torrents) {
      if (!torrent.tracker || torrent.tracker.indexOf('btschool') !== -1) {
        continue;
      }
      if (this.reannouncedHash.includes(torrent.hash)) {
        continue;
      }
      const now = moment().unix();
      if (now - torrent.addedTime <= 360 && now - torrent.addTime >= 300) {
        await this.reannounceTorrent(torrent);
        this.reannouncedHash.push(torrent.hash);
      }
    }
  }

  async autoDelete () {
    if (!this.maindata || !this.maindata.torrents || this.maindata.torrents.length === 0) return;
    const torrents = this.maindata.torrents.sort((a, b) =>
      (a.completedTime <= 0 ? moment().unix() : a.completedTime) - (b.completedTime <= 0 ? moment().unix() : b.completedTime) ||
        a.addedTime - b.addedTime);
    const deletedTorrentHash = [];
    const rejectDeleteHash = {};
    for (const torrent of torrents) {
      if (this.rejectDeleteRules.some(item => this._fitDeleteRule({ ...item }, torrent))) {
        rejectDeleteHash[torrent.hash] = 1;
      }
    }
    for (const _rule of this.deleteRules) {
      const rule = { ..._rule };
      rule.deleteNum = rule.deleteNum || 1;
      let deletedNum = 0;
      for (const torrent of torrents) {
        if (rejectDeleteHash[torrent.hash]) {
          continue;
        }
        if (rule.deleteNum <= deletedNum) {
          logger.debug('规则', rule.alias, ', 单次删除种子数量已达上限', rule.deleteNum, '退出删种任务');
          break;
        }
        if (deletedTorrentHash.indexOf(torrent.hash) !== -1) {
          logger.debug('规则', rule.alias, ', 种子', torrent.name, '已删除', '跳过');
          continue;
        }
        if ((rule.limitSpeed || rule.pause) && this.pausedTorrentHashes.includes(torrent.hash)) {
          logger.debug('规则', rule.alias, ', 种子', torrent.name, '已暂停或限速', '跳过');
          continue;
        }
        if (this._fitDeleteRule(rule, torrent)) {
          deletedNum += 1;
          await this.reannounceTorrent(torrent);
          logger.info(torrent.name, '重新汇报完毕, 等待 2s');
          await util.sleep(2000);
          logger.info(torrent.name, '等待 2s 完毕, 执行删种');
          await util.runRecord('update torrents set size = ?, tracker = ?, upload = ?, download = ?, delete_time = ?, record_note = ? where hash = ?',
            [torrent.size, torrent.tracker, torrent.uploaded, torrent.downloaded, moment().unix(), `删种规则: ${rule.alias}`, torrent.hash]);
          await util.runRecord('insert into torrent_flow (hash, upload, download, time) values (?, ?, ?, ?)',
            [torrent.hash, torrent.uploaded, torrent.downloaded, moment().unix()]);
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
    const torrentSet = {};
    const now = moment().startOf('minute').unix();
    const allTorrentLastMinute = await util.getRecords('select * from torrent_flow where time = ?', [moment().startOf('minute').subtract(5, 'minute').unix()]);
    allTorrentLastMinute.forEach(i => {
      torrentSet[i.hash] = i;
    });
    const trackerSet = {};
    for (const torrent of this.maindata.torrents) {
      const cache = await redis.get('vertex:torrent:' + torrent.hash);
      // 0 无记录  1 种子存在  2 种子不存在
      if (!cache) {
        const sqlRes = await util.getRecord('SELECT * FROM torrents WHERE hash = ? and record_type = 1', [torrent.hash]);
        await redis.set('vertex:torrent:' + torrent.hash, sqlRes ? 1 : 2);
        if (!sqlRes) continue;
      }
      if (+cache === 2) continue;
      await util.runRecord('update torrents set size = ?, tracker = ?, upload = ?, download = ? where hash = ?',
        [torrent.size, torrent.tracker, torrent.uploaded, torrent.downloaded, torrent.hash]);
      await util.runRecord('insert into torrent_flow (hash, upload, download, time) values (?, ?, ?, ?)',
        [torrent.hash, torrent.uploaded, torrent.downloaded, now]);
      if (!trackerSet[torrent.tracker]) trackerSet[torrent.tracker] = { upload: 0, download: 0, time: now };
      torrentSet[torrent.hash] = torrentSet[torrent.hash] || { upload: torrent.uploaded, download: torrent.downloaded };
      trackerSet[torrent.tracker].upload += torrent.uploaded - torrentSet[torrent.hash].upload;
      trackerSet[torrent.tracker].download += torrent.downloaded - torrentSet[torrent.hash].download;
    }
    for (const key of Object.keys(trackerSet)) {
      const tracker = trackerSet[key];
      const record = await util.getRecord('select * from tracker_flow where tracker = ? and time = ?', [key, now]);
      if (!record) {
        await util.runRecord('insert into tracker_flow (tracker, upload, download, time) values (?, ?, ?, ?)', [key, tracker.upload, tracker.download, now]);
      } else {
        await util.runRecord('update tracker_flow set upload = upload + ?, download = download + ? where tracker = ? and time = ?', [tracker.upload, tracker.download, key, now]);
      }
    }
  };

  flashFitTime (rule) {
    if (!this.maindata || !this.maindata.torrents || this.maindata.torrents.length === 0) return;
    try {
      const torrents = this.maindata.torrents;
      for (const torrent of torrents) {
        if (this._fitDeleteRule(rule, torrent, true)) {
          this.fitTime[rule.id][torrent.hash] = this.fitTime[rule.id][torrent.hash] || moment().unix();
        } else {
          delete this.fitTime[rule.id][torrent.hash];
        }
      }
    } catch (e) {
      logger.error('下载器', this.alias, '\n', e);
    }
  }

  async trackerSync () {
    if (!this.maindata || !this.maindata.torrents || this.maindata.torrents.length === 0) return;
    const torrents = this.maindata.torrents;
    for (const torrent of torrents) {
      try {
        if (await redis.get(`vertex:torrent_tracker:${torrent.hash}`)) continue;
        const sqlRes = await util.getRecord('SELECT * FROM torrents WHERE hash = ?', [torrent.hash]);
        if (!sqlRes || !!sqlRes.delete_time) {
          await redis.set(`vertex:torrent_tracker:${torrent.hash}`, 1);
          continue;
        };
        const { statusCode, body } = await this.client.getTrackerList(this.clientUrl, this.cookie, torrent.hash);
        if (statusCode === 404) {
          logger.debug('下载器', this.alias, '种子', torrent.name, 'tracker 状态同步 404');
          continue;
        }
        if (statusCode !== 200) {
          throw new Error('状态码: ' + statusCode);
        }
        const trackerList = JSON.parse(body);
        this.trackerStatus[torrent.hash] = trackerList.filter(i => i.url.indexOf('**') === -1).map(i => i.msg).join('');
      } catch (e) {
        logger.error('下载器', this.alias, '种子', torrent.name, 'tracker 状态同步失败, 报错如下:\n', e);
      }
    }
  };

  async pushSpaceAlarm () {
    if (!this.spaceAlarm || this.alarmSpace < this.maindata.freeSpaceOnDisk) return;
    try {
      await this.ntf.spaceAlarm(this);
    } catch (e) {
      logger.error('下载器', this.alias, '\n', e);
    }
  }

  async getFiles (hash) {
    if (this._client.type === 'qBittorrent') {
      return await this.client.getFiles(this.clientUrl, this.cookie, hash);
    }
    if (this._client.type === 'Transmission') {
      for (const t of this.maindata.torrents) {
        if (t.hash === hash) {
          return await this.client.getFiles(this.clientUrl, this.cookie, t.id);
        }
      }
    }
  }

  async setSpeedLimit (hash, type, speed) {
    if (this._client.type === 'qBittorrent') {
      await this.client.setSpeedLimit(this.clientUrl, this.cookie, hash, type, speed);
    }
  }

  async setGlobalSpeedLimit (type, speed) {
    if (this._client.type === 'qBittorrent') {
      await this.client.setGlobalSpeedLimit(this.clientUrl, this.cookie, type, speed);
    }
  }

  async getGlobalSpeedLimit (type) {
    if (this._client.type === 'qBittorrent') {
      return await this.client.getGlobalSpeedLimit(this.clientUrl, this.cookie, type);
    }
    return 0;
  }

  async setFilePriority (hash, id, priority) {
    if (this._client.type === 'qBittorrent') {
      await this.client.setFilePriority(this.clientUrl, this.cookie, hash, id, priority);
    }
  }

  async resumeTorrent (hash) {
    if (this._client.type === 'qBittorrent') {
      await this.client.resumeTorrent(this.clientUrl, this.cookie, hash);
    }
  }

  async pauseTorrent (hash) {
    if (this._client.type === 'qBittorrent') {
      await this.client.pauseTorrent(this.clientUrl, this.cookie, hash);
    }
  }

  async getLogs (hash) {
    if (this._client.type === 'qBittorrent') {
      return await this.client.getLogs(this.clientUrl, this.cookie, hash);
    }
    return [];
  }
}
module.exports = Client;
