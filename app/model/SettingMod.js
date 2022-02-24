const fs = require('fs');
const path = require('path');
const moment = require('moment');
const util = require('../libs/util');
const CronJob = require('cron').CronJob;
const Push = require('../common/Push');

const settingPath = path.join(__dirname, '../data/setting.json');
const torrentHistorySettingPath = path.join(__dirname, '../data/setting/torrent-history-setting.json');
const torrentMixSettingPath = path.join(__dirname, '../data/setting/torrent-mix-setting.json');
const sitePushSettingPath = path.join(__dirname, '../data/setting/site-push-setting.json');

class SettingMod {
  get () {
    const settingStr = fs.readFileSync(settingPath, { encoding: 'utf-8' });
    return JSON.parse(settingStr);
  };

  getBackground () {
    const settingStr = fs.readFileSync(settingPath, { encoding: 'utf-8' });
    return JSON.parse(settingStr).background;
  };

  modify (options) {
    fs.writeFileSync(settingPath, JSON.stringify(options, null, 2));
    global.auth = {
      username: options.username,
      password: options.password
    };
    global.userAgent = options.userAgent;
    global.dataPath = options.dataPath || '/';
    global.telegramProxy = options.telegramProxy || 'https://api.telegram.org';
    return '修改全局设置成功, 刷新页面后更新。';
  };

  getTorrentHistorySetting () {
    const settingStr = fs.readFileSync(torrentHistorySettingPath, { encoding: 'utf-8' });
    return JSON.parse(settingStr);
  };

  modifyTorrentHistorySetting (options) {
    fs.writeFileSync(torrentHistorySettingPath, JSON.stringify(options, null, 2));
    return '修改成功';
  };

  getTorrentMixSetting () {
    const settingStr = fs.readFileSync(torrentMixSettingPath, { encoding: 'utf-8' });
    return JSON.parse(settingStr);
  };

  modifyTorrentMixSetting (options) {
    fs.writeFileSync(torrentMixSettingPath, JSON.stringify(options, null, 2));
    return '修改成功';
  };

  getSitePushSetting () {
    const settingStr = fs.readFileSync(sitePushSettingPath, { encoding: 'utf-8' });
    return JSON.parse(settingStr);
  };

  modifySitePushSetting (options) {
    fs.writeFileSync(sitePushSettingPath, JSON.stringify(options, null, 2));
    if (global.sitePushJob) global.sitePushJob.stop();
    global.sitePushJob = new CronJob(options.cron, () => {
      const pushTo = util.listPush().filter(item => item.id === options.pushTo)[0] || {};
      pushTo.push = true;
      const push = new Push(pushTo);
      push.pushSiteData();
    });
    global.sitePushJob.start();
    return '修改成功';
  };

  async getRunInfo () {
    const { uploaded, downloaded } = (await util.getRecord('select sum(upload) as uploaded, sum(download) as downloaded from torrents'));
    const addCountToday = (await util.getRecord('select count(*) as addCount from torrents where record_type = 1 and record_time > ?', [moment().startOf('day').unix()])).addCount;
    const rejectCountToday = (await util.getRecord('select count(*) as rejectCount from torrents where record_type = 2 and record_time > ?', [moment().startOf('day').unix()])).rejectCount;
    const deleteCountToday = (await util.getRecord('select count(*) as deleteCount from torrents where delete_time is not null and record_time > ?', [moment().startOf('day').unix()])).deleteCount;
    const addCount = (await util.getRecord('select count(*) as addCount from torrents where record_type = 1')).addCount;
    const rejectCount = (await util.getRecord('select count(*) as rejectCount from torrents where record_type = 2')).rejectCount;
    const deleteCount = (await util.getRecord('select count(*) as deleteCount from torrents where delete_time is not null')).deleteCount;
    const perTracker = (await util.getRecords('select sum(upload) as uploaded, sum(download) as downloaded, tracker from torrents where tracker is not null group by tracker'));
    const perTrackerToday = (await util.getRecords('select sum(upload) as uploaded, sum(download) as downloaded, tracker from torrents  where add_time > ? and tracker is not null group by tracker', [moment().startOf('day').unix()]));
    let uploadedToday = 0;
    let downloadedToday = 0;
    const torrents = await util.getRecords('select hash, max(upload) - min(upload) as upload,  max(download) - min(download) as download from torrent_flow where time >= ? group by hash', [moment().startOf('day').unix()]);
    for (const torrent of torrents) {
      uploadedToday += torrent.upload;
      downloadedToday += torrent.download;
    }
    return {
      uploaded: uploaded || 0,
      downloaded: downloaded || 0,
      uploadedToday: uploadedToday || 0,
      downloadedToday: downloadedToday || 0,
      addCount,
      rejectCount,
      deleteCount,
      addCountToday,
      rejectCountToday,
      deleteCountToday,
      startTime: global.startTime,
      perTracker,
      perTrackerToday
    };
  };

  async backupVertex () {
    const backupsFile = `/tmp/Vertex-backups-${moment().format('YYYY-MM-DD_HH:mm:ss')}.tar.gz`;
    await util.tar.c({
      gzip: true,
      file: backupsFile,
      cwd: global.dataPath
    }, ['vertex']);
    return backupsFile;
  }

  async restoreVertex (options) {
    const backupsFile = options.file.path || options.file.originalFilename;
    await util.tar.x({
      gzip: true,
      file: backupsFile,
      C: global.dataPath
    });
    return '数据导入成功, 重启容器后生效。';
  }
}

module.exports = SettingMod;
