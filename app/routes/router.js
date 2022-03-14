const Multipart = require('connect-multiparty');
const session = require('express-session');
const proxy = require('express-http-proxy');
const redis = require('redis');
const path = require('path');
const fs = require('fs');

const config = require('../libs/config');
const logger = require('../libs/logger');
const ctrl = require('../controller');
const util = require('../libs/util');

const client = redis.createClient(config.getRedisConfig());
const RedisStore = require('connect-redis')(session);

const multipartMiddleware = new Multipart();

client.on('error', (err) => {
  logger.error('Redis:', err);
});

const redisConfig = config.getRedisConfig();
redisConfig.client = client;
redisConfig.prefix = 'vertex:sess:';

const checkAuth = async function (req, res, next) {
  const pathname = req._parsedOriginalUrl.pathname;
  const excludePath = [
    '/api/user/login',
    '/api/setting/getBackground',
    '/login'
  ];
  if (req.session.user && ['/', '/login'].includes(pathname)) {
    return res.redirect(302, '/home');
  }
  if (excludePath.includes(pathname) ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/api/openapi') ||
    pathname === '/favicon.ico') {
    return next();
  }
  if (!req.session.user && !pathname.startsWith('/api')) {
    return res.redirect(302, '/login');
  }
  if (!req.session.user) {
    res.status(401);
    return res.send({
      success: false,
      message: '鉴权失效'
    });
  }
  next();
};

const setIp = function (req, res, next) {
  req.userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip;
  if (req.userIp.substring(0, 7) === '::ffff:') {
    req.userIp = req.userIp.substring(7);
  }
  next();
};

const clientProxy = function (req, res, next) {
  const clientList = util.listClient();
  const clientId = req.params.client;
  const client = clientList.filter(item => item.id === clientId)[0];
  if (!client) {
    res.status(404);
    res.end('Not Found');
    return;
  }
  proxy(client.clientUrl, {
    proxyReqOptDecorator (proxyReqOpts, srcReq) {
      proxyReqOpts.headers.cookie = global.runningClient[clientId] ? global.runningClient[clientId].cookie || '' : '';
      if (proxyReqOpts.headers['content-type'] && proxyReqOpts.headers['content-type'].indexOf('application/x-www-form-urlencoded') !== -1) {
        proxyReqOpts.headers['content-type'] = 'application/x-www-form-urlencoded';
      }
      proxyReqOpts.rejectUnauthorized = false;
      return proxyReqOpts;
    },
    reqBodyEncoding: null
  })(req, res, next);
};

const siteProxy = function (req, res, next) {
  const siteList = util.listSite();
  const siteId = req.params.site;
  const site = siteList.filter(item => item.name === siteId)[0];
  if (!site || !global.runningSite[siteId] || !global.runningSite[siteId].siteUrl) {
    res.status(404);
    res.end('Not Found');
    return;
  }
  const siteUrl = global.runningSite[siteId].siteUrl;
  proxy(siteUrl, {
    proxyReqOptDecorator (proxyReqOpts, srcReq) {
      proxyReqOpts.headers.cookie = global.runningSite[siteId] ? global.runningSite[siteId].cookie : '';
      proxyReqOpts.headers.Referer = siteUrl;
      if (proxyReqOpts.headers['content-type'] && proxyReqOpts.headers['content-type'].indexOf('application/x-www-form-urlencoded') !== -1) {
        proxyReqOpts.headers['content-type'] = 'application/x-www-form-urlencoded';
      }
      proxyReqOpts.headers['accept-encoding'] = 'gzip, deflate';
      proxyReqOpts.rejectUnauthorized = false;
      return proxyReqOpts;
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
      if (proxyRes.headers['content-type'].indexOf('text/html') !== -1) {
        proxyResData = proxyResData.toString('utf8').replace(/src=(['"])\//g, 'src=$1').replace(/href=(["'])\//g, 'href=$1');
      }
      return proxyResData;
    },
    reqBodyEncoding: null
  })(req, res, next);
};

module.exports = function (app, express, router) {
  app.use(session({
    genid: () => util.uuid.v4().replace(/-/g, ''),
    resave: false,
    rolling: true,
    saveUninitialized: false,
    store: new RedisStore(redisConfig),
    secret: 'sses:xetrev',
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30
    }
  }));
  app.use('/api', express.text({ type: 'text/xml' }));
  app.use('/api', express.json());
  app.use('/api', express.urlencoded({ extended: false }));
  app.use('/api', multipartMiddleware);
  app.use(setIp);
  app.use(checkAuth);

  router.get('/user/login', ctrl.User.login);
  router.get('/user/logout', ctrl.User.logout);

  router.get('/server/netSpeed', ctrl.Server.netSpeed);
  router.get('/server/cpuUse', ctrl.Server.cpuUse);
  router.get('/server/diskUse', ctrl.Server.diskUse);
  router.get('/server/memoryUse', ctrl.Server.memoryUse);
  router.get('/server/vnstat', ctrl.Server.vnstat);
  router.get('/server/list', ctrl.Server.list);
  router.post('/server/add', ctrl.Server.add);
  router.post('/server/modify', ctrl.Server.modify);
  router.post('/server/delete', ctrl.Server.delete);
  router.get('/server/reload', ctrl.Server.reload);

  router.post('/push/add', ctrl.Push.add);
  router.get('/push/list', ctrl.Push.list);
  router.post('/push/modify', ctrl.Push.modify);
  router.post('/push/delete', ctrl.Push.delete);

  router.post('/site/add', ctrl.Site.add);
  router.get('/site/list', ctrl.Site.list);
  router.post('/site/modify', ctrl.Site.modify);
  router.post('/site/delete', ctrl.Site.delete);
  router.get('/site/refresh', ctrl.Site.refresh);
  router.get('/site/search', ctrl.Site.search);
  router.get('/site/pushTorrent', ctrl.Site.pushTorrent);

  router.get('/client/list', ctrl.Client.list);
  router.get('/client/getSpeedPerTracker', ctrl.Client.getSpeedPerTracker);
  router.post('/client/add', ctrl.Client.add);
  router.post('/client/modify', ctrl.Client.modify);
  router.post('/client/delete', ctrl.Client.delete);

  router.get('/rss/list', ctrl.Rss.list);
  router.post('/rss/add', ctrl.Rss.add);
  router.post('/rss/modify', ctrl.Rss.modify);
  router.post('/rss/delete', ctrl.Rss.delete);

  router.get('/douban/list', ctrl.Douban.list);
  router.post('/douban/add', ctrl.Douban.add);
  router.post('/douban/modify', ctrl.Douban.modify);
  router.post('/douban/delete', ctrl.Douban.delete);
  router.get('/douban/listHistory', ctrl.Douban.listHistory);
  router.get('/douban/listWishes', ctrl.Douban.listWishes);
  router.post('/douban/deleteItem', ctrl.Douban.deleteItem);
  router.get('/douban/deleteRecord', ctrl.Douban.deleteRecord);
  router.post('/douban/refreshWishes', ctrl.Douban.refreshWishes);
  router.get('/douban/relink', ctrl.Douban.relink);

  router.get('/deleteRule/list', ctrl.DeleteRule.list);
  router.post('/deleteRule/add', ctrl.DeleteRule.add);
  router.post('/deleteRule/modify', ctrl.DeleteRule.modify);
  router.post('/deleteRule/delete', ctrl.DeleteRule.delete);

  router.get('/raceRule/list', ctrl.RaceRule.list);
  router.post('/raceRule/add', ctrl.RaceRule.add);
  router.post('/raceRule/modify', ctrl.RaceRule.modify);
  router.post('/raceRule/delete', ctrl.RaceRule.delete);

  router.get('/rssRule/list', ctrl.RssRule.list);
  router.post('/rssRule/add', ctrl.RssRule.add);
  router.post('/rssRule/modify', ctrl.RssRule.modify);
  router.post('/rssRule/delete', ctrl.RssRule.delete);

  router.get('/linkRule/list', ctrl.LinkRule.list);
  router.post('/linkRule/add', ctrl.LinkRule.add);
  router.post('/linkRule/modify', ctrl.LinkRule.modify);
  router.post('/linkRule/delete', ctrl.LinkRule.delete);

  router.get('/torrent/list', ctrl.Torrent.list);
  router.get('/torrent/listHistory', ctrl.Torrent.listHistory);
  router.get('/torrent/info', ctrl.Torrent.info);

  router.get('/log/get', ctrl.Log.get);
  router.get('/log/clear', ctrl.Log.clear);

  router.get('/setting/get', ctrl.Setting.get);
  router.get('/setting/getRunInfo', ctrl.Setting.getRunInfo);
  router.get('/setting/getTorrentHistorySetting', ctrl.Setting.getTorrentHistorySetting);
  router.get('/setting/getTorrentMixSetting', ctrl.Setting.getTorrentMixSetting);
  router.get('/setting/getSitePushSetting', ctrl.Setting.getSitePushSetting);
  router.get('/setting/getBackground', ctrl.Setting.getBackground);
  router.post('/setting/modify', ctrl.Setting.modify);
  router.post('/setting/modifyTorrentHistorySetting', ctrl.Setting.modifyTorrentHistorySetting);
  router.post('/setting/modifyTorrentMixSetting', ctrl.Setting.modifyTorrentMixSetting);
  router.post('/setting/modifySitePushSetting', ctrl.Setting.modifySitePushSetting);
  router.get('/setting/backupVertex', ctrl.Setting.backupVertex);
  router.post('/setting/restoreVertex', ctrl.Setting.restoreVertex);
  router.get('/setting/getCss.css', ctrl.Setting.getCss);

  router.all('/openapi/:apiKey/plex', ctrl.Webhook.plex);
  router.all('/openapi/:apiKey/emby', ctrl.Webhook.emby);
  router.all('/openapi/:apiKey/jellyfin', ctrl.Webhook.jellyfin);
  router.all('/openapi/:apiKey/wechat', ctrl.Webhook.wechat);

  app.use('/api', router);
  app.use('/proxy/client/:client', clientProxy);
  app.use('/proxy/site/:site', siteProxy);
  app.use('*', (req, res, next) => {
    const pathname = req._parsedOriginalUrl.pathname;
    if (pathname === '/favicon.ico') {
      return res.download(path.join(__dirname, '../static', pathname));
    }
    if (pathname.startsWith('/assets')) {
      return res.download(path.join(__dirname, '../static', pathname));
    }
    try {
      res.send(fs.readFileSync(path.join(__dirname, '../static/index.html'), 'utf-8'));
    } catch (err) {
      logger.info(err);
      res.status(404);
      res.end('Not Found');
    }
  });
};
