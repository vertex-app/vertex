const express = require('express');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const app = express();
const router = express.Router();
const CronJob = require('cron').CronJob;
const Push = require('./common/Push');

const logger = require('./libs/logger');
const util = require('./libs/util');
const config = require('./libs/config');
logger.use(app);

require('./routes/router.js')(app, express, router);

const init = function () {
  const sitePushSettng = JSON.parse(fs.readFileSync(path.join(__dirname, './data/setting/site-push-setting.json')));
  if (sitePushSettng.push) {
    global.sitePushJob = new CronJob(sitePushSettng.cron, () => {
      const pushTo = util.listPush().filter(item => item.id === sitePushSettng.pushTo)[0] || {};
      pushTo.push = true;
      const push = new Push(pushTo);
      push.pushSiteData();
    });
    global.sitePushJob.start();
  }
  global.clearDatabase = new CronJob('0 0 * * *', async () => {
    await util.runRecord('delete from torrent_flow where time < ?', [moment().unix() - 1]);
  });
  global.clearDatabase.start();
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
  global.userAgent = setting.userAgent;
  global.dataPath = setting.dataPath || '/';
  global.runningClient = {};
  global.runningRss = {};
  global.runningServer = {};
  global.runningSite = {};
  global.startTime = moment().unix();
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
