const express = require('express');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const ws = require('express-ws');
const app = express();
const router = express.Router();
const cron = require('node-cron');

const Push = require('./common/Push');
const Script = require('./common/Script');
const Client = require('./common/Client');
const Rss = require('./common/Rss');
const Server = require('./common/Server');
const Douban = require('./common/Douban');
const Site = require('./common/Site');
const Watch = require('./common/Watch');
const IRC = require('./common/IRC');

const sites = require('./libs/site');
const logger = require('./libs/logger');
const util = require('./libs/util');
const config = require('./libs/config');
const { execSync } = require('child_process');
logger.use(app);

const initPush = function () {
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
  global.clearDatabase = cron.schedule('1 0 * * *', async () => {
    try {
      await util.runRecord('delete from torrent_flow where time < ?', [moment().unix() - 1]);
      await util.runRecord('delete from tracker_flow where time < ?', [moment().unix() - 7 * 24 * 3600]);
      execSync('rm -f /tmp/Vertex-backups-*');
    } catch (e) {
      logger.error(e);
    }
  });

  global.CONFIG = config;
  global.LOGGER = logger;
  global.SITE = sites;
  global.linkMapping = JSON.parse(fs.readFileSync(path.join(__dirname, './data/link-mapping.json')));
  const setting = JSON.parse(fs.readFileSync(path.join(__dirname, './data/setting.json')));
  if (!setting.password) {
    const password = util.uuid.v4();
    setting.username = 'admin';
    setting.password = util.md5(password);
    fs.writeFileSync(path.join(__dirname, './data/password'), password);
    fs.writeFileSync(path.join(__dirname, './data/setting.json'), JSON.stringify(setting, null, 2));
  }
  const proxySetting = JSON.parse(fs.readFileSync(path.join(__dirname, './data/setting/proxy.json')));
  global.proxy = proxySetting.proxy;
  global.domains = proxySetting.domains;
  global.auth = {
    username: setting.username,
    password: setting.password,
    otp: setting.otp
  };
  global.telegramProxy = setting.telegramProxy || 'https://api.telegram.org';
  global.wechatProxy = setting.wechatProxy;
  global.checkFinishCron = setting.checkFinishCron || '30 * * * * *';
  global.userAgent = setting.userAgent;
  global.ignoreError = setting.ignoreError;
  global.ignoreDependCheck = setting.ignoreDependCheck;
  global.webhookPushTo = setting.webhookPushTo;
  global.doubanPush = setting.doubanPush;
  global.apiKey = setting.apiKey;
  global.tmdbApiKey = setting.tmdbApiKey;
  global.trustVertexPanel = setting.trustVertexPanel;
  global.transparent = setting.transparent;
  global.background = setting.background;
  global.wechatCover = setting.wechatCover;
  global.embyCover = setting.embyCover;
  global.plexCover = setting.plexCover;
  global.theme = setting.theme || 'light';
  global.siteInfo = setting.siteInfo || {
    hide: [],
    hideName: [],
    watermark: 'vertex'
  };
  global.trustAllCerts = setting.trustAllCerts;
  global.menu = setting.menu || [];
  global.dashboardContent = setting.dashboardContent || [];
  global.wechatToken = setting.wechatToken;
  global.wechatAesKey = setting.wechatAesKey;
  global.panelKey = setting.panelKey;
  global.jellyfinCover = setting.jellyfinCover;
  global.dataPath = setting.dataPath || '/';
  global.runningClient = {};
  global.runningRss = {};
  global.runningServer = {};
  global.runningSite = {};
  global.runningRace = {};
  global.runningDouban = {};
  global.runningScript = {};
  global.runningWatch = {};
  global.runningIRC = {};
  global.startTime = moment().unix();
  initPush();
  for (const client of util.listClient()) {
    if (client.enable) {
      global.runningClient[client.id] = new Client(client);
    }
  }
  for (const rss of util.listRss()) {
    if (rss.enable) {
      global.runningRss[rss.id] = new Rss(rss);
    }
  }
  for (const server of util.listServer()) {
    if (server.enable) {
      global.runningServer[server.id] = new Server(server);
    }
  }
  for (const site of util.listSite()) {
    if (site.enable) {
      global.runningSite[site.name] = new Site(site);
    }
  }
  for (const douban of util.listDouban()) {
    if (douban.enable) {
      global.runningDouban[douban.id] = new Douban(douban);
    }
  }
  for (const script of util.listCrontabJavaScript()) {
    if (script.enable) {
      global.runningScript[script.id] = new Script(script);
    }
  }
  for (const watch of util.listWatch()) {
    if (watch.enable) {
      global.runningWatch[watch.id] = new Watch(watch);
    }
  }
  for (const irc of util.listIRC()) {
    if (irc.enable) {
      global.runningIRC[irc.id] = new IRC(irc);
    }
  }
  // cookiecloud
  util.initCookieCloud();
};

(async () => {
  try {
    init();
  } catch (e) {
    logger.error('初始化任务报错\n', e);
  }
  try {
    const server = http.createServer(app).listen(process.env.PORT);
    ws(app, server);
    logger.info('HTTP 服务器启动, 监听端口: ', process.env.PORT);
  } catch (e) {
    logger.error(e);
    logger.error('HTTP 服务器启动失败, 监听端口: ', process.env.PORT);
  }
  if (process.env.HTTPS_ENABLE === 'true') {
    try {
      const options = {
        key: fs.readFileSync(path.join(__dirname, './data/ssl/https.key')),
        cert: fs.readFileSync(path.join(__dirname, './data/ssl/https.crt'))
      };
      const server = https.createServer(options, app).listen(process.env.HTTPS_PORT);
      ws(app, server);
      logger.info('HTTPS 服务器启动, 监听端口: ', process.env.HTTPS_PORT);
    } catch (e) {
      logger.error(e);
      logger.error('HTTPS 服务器启动失败, 监听端口: ', process.env.HTTPS_PORT);
    }
  }
  require('./routes/router.js')(app, express, router);
})();
