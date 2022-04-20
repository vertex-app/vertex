const express = require('express');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const app = express();
const router = express.Router();
const cron = require('node-cron');
const Push = require('./common/Push');

const logger = require('./libs/logger');
const util = require('./libs/util');
const config = require('./libs/config');
logger.use(app);

require('./routes/router.js')(app, express, router);

const initPush = function () {
  const sitePushSettng = JSON.parse(fs.readFileSync(path.join(__dirname, './data/setting/site-push-setting.json')));
  if (sitePushSettng.push) {
    global.sitePushJob = cron.schedule(sitePushSettng.cron, () => {
      const pushTo = util.listPush().filter(item => item.id === sitePushSettng.pushTo)[0] || {};
      pushTo.push = true;
      const push = new Push(pushTo);
      push.pushSiteData();
    });
  }
  const webhookPush = util.listPush().filter(item => item.id === global.webhookPushTo)[0];
  if (webhookPush) {
    global.webhookPush = new Push({ ...webhookPush, push: true });
  }
  const doubanPush = util.listPush().filter(item => item.id === global.doubanPush)[0];
  if (doubanPush) {
    global.doubanPush = new Push({ ...doubanPush, push: true });
  }
};

const init = function () {
  global.clearDatabase = cron.schedule('0 0 * * *', async () => {
    await util.runRecord('delete from torrent_flow where time < ?', [moment().unix() - 1]);
    await util.runRecord('delete from tracker_flow where time < ?', [moment().unix() - 7 * 24 * 3600]);
  });

  global.CONFIG = config;
  global.LOGGER = logger;
  const setting = JSON.parse(fs.readFileSync(path.join(__dirname, './data/setting.json')));
  if (!setting.password) {
    const password = util.uuid.v4();
    setting.username = 'admin';
    setting.password = util.md5(password);
    fs.writeFileSync(path.join(__dirname, './data/password'), password);
    fs.writeFileSync(path.join(__dirname, './data/setting.json'), JSON.stringify(setting, null, 2));
  }
  global.auth = {
    username: setting.username,
    password: setting.password
  };
  global.telegramProxy = setting.telegramProxy || 'https://api.telegram.org';
  global.checkFinishCron = setting.checkFinishCron || '30 * * * * *';
  global.userAgent = setting.userAgent;
  global.webhookPushTo = setting.webhookPushTo;
  global.doubanPush = setting.doubanPush;
  global.apiKey = setting.apiKey;
  global.tmdbApiKey = setting.tmdbApiKey;
  global.transparent = setting.transparent;
  global.blurSize = setting.blurSize;
  global.wechatCover = setting.wechatCover;
  global.embyCover = setting.embyCover;
  global.plexCover = setting.plexCover;
  global.wechatToken = setting.wechatToken;
  global.wechatAesKey = setting.wechatAesKey;
  global.jellyfinCover = setting.jellyfinCover;
  global.dataPath = setting.dataPath || '/';
  global.runningClient = {};
  global.runningRss = {};
  global.runningServer = {};
  global.runningSite = {};
  global.runningRace = {};
  global.runningDouban = {};
  global.startTime = moment().unix();
  initPush();
  for (const client of util.listClient()) {
    if (client.enable) {
      const Client = require('./common/Client');
      global.runningClient[client.id] = new Client(client);
    }
  }
  for (const rss of util.listRss()) {
    if (rss.enable) {
      const Rss = require('./common/Rss');
      global.runningRss[rss.id] = new Rss(rss);
    }
  }
  for (const server of util.listServer()) {
    if (server.enable) {
      const Server = require('./common/Server');
      global.runningServer[server.id] = new Server(server);
    }
  }
  for (const site of util.listSite()) {
    if (site.enable) {
      const Site = require('./common/Site');
      global.runningSite[site.name] = new Site(site);
    }
  }
  for (const douban of util.listDouban()) {
    const Douban = require('./common/Douban');
    global.runningDouban[douban.id] = new Douban(douban);
  }
};

(async () => {
  try {
    init();
  } catch (e) {
    logger.error('初始化任务报错\n', e);
  }
  app.listen(process.env.PORT, () => {
    logger.info('Server started, listening', process.env.PORT);
  });
})();
