const express = require('express');
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
  global.CONFIG = config;
  global.LOGGER = logger;
  const setting = JSON.parse(fs.readFileSync(path.join(__dirname, './data/setting.json')));
  global.auth = {
    username: setting.username || 'admin',
    password: setting.password || '5f4dcc3b5aa765d61d8327deb882cf99'
  };
  global.userAgent = setting.userAgent;
  global.runningClient = {};
  global.runningRss = {};
  global.runningServer = {};
  global.runningSite = {};
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
