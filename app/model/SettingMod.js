const fs = require('fs');
const path = require('path');
const util = require('../libs/util');
const CronJob = require('cron').CronJob;
const Push = require('../common/Push');

const settingPath = path.join(__dirname, '../data/setting.json');
const torrentHistorySettingPath = path.join(__dirname, '../data/setting/torrent-history-setting.json');
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
      username: options.username || 'admin',
      password: options.password || '5f4dcc3b5aa765d61d8327deb882cf99'
    };
    global.userAgent = options.userAgent;
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
}

module.exports = SettingMod;
