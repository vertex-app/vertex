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
    '/api/setting/getBackground.less',
    '/api/setting/getCss.css',
    '/user/login',
    '/service-worker.js',
    '/service-worker.js.map'
  ];
  if (req.session?.user && ['/', '/user/login'].includes(pathname)) {
    return res.redirect(302, '/index');
  }
  if (excludePath.includes(pathname) ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/workbox') ||
    pathname.startsWith('/api/openapi') ||
    pathname === '/favicon.ico') {
    return next();
  }
  if (!req.session?.user && !pathname.startsWith('/api')) {
    return res.redirect(302, '/user/login');
  }
  if (!req.session?.user) {
    res.status(401);
    return res.send({
      success: false,
      message: '鉴权失效, 请刷新页面后重新登录'
    });
  }
  next();
};

const setIp = function (req, res, next) {
  req.userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip || '';
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
    reqBodyEncoding: null,
    limit: '20mb'
  })(req, res, next);
};

const siteProxy = function (req, res, next) {
  const siteList = util.listSite();
  const siteId = req.params.site;
  const site = siteList.filter(item => item.name === siteId)[0];
  if (!site || !global.runningSite[siteId] || !global.runningSite[siteId].siteUrl) {
    res.status(404);
    res.setHeader('Content-Type', 'text/html; charset=utf-8;');
    res.end('暂不支持 ' + siteId + ' 代理登录, 请直接使用站点网址打开。');
    return;
  }
  const siteUrl = global.runningSite[siteId].siteUrl;
  proxy(siteUrl, {
    proxyReqOptDecorator (proxyReqOpts, srcReq) {
      proxyReqOpts.headers.cookie = global.runningSite[siteId] ? global.runningSite[siteId].cookie : '';
      proxyReqOpts.headers['user-agent'] = global.userAgent || 'Vertex';
      delete proxyReqOpts.headers['x-forwarded-for'];
      proxyReqOpts.headers.Referer = siteUrl;
      if (proxyReqOpts.headers['content-type'] && proxyReqOpts.headers['content-type'].indexOf('application/x-www-form-urlencoded') !== -1) {
        proxyReqOpts.headers['content-type'] = 'application/x-www-form-urlencoded';
      }
      proxyReqOpts.headers['accept-encoding'] = 'gzip, deflate';
      proxyReqOpts.rejectUnauthorized = false;
      return proxyReqOpts;
    },
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
      if (proxyRes.headers['content-type']?.indexOf('text/html') !== -1) {
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
  app.use('/api', express.json({ limit: '50mb' }));
  app.use('/api', express.urlencoded({ extended: false }));
  app.use('/api', multipartMiddleware);
  app.use(setIp);
  app.use(checkAuth);
  router.post('/user/login', ctrl.User.login);
  router.get('/user/logout', ctrl.User.logout);
  router.get('/user/get', ctrl.User.get);

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
  router.ws('/server/shell/:serverId', ctrl.Server.shell);

  router.post('/notification/add', ctrl.Push.add);
  router.get('/notification/list', ctrl.Push.list);
  router.post('/notification/modify', ctrl.Push.modify);
  router.post('/notification/delete', ctrl.Push.delete);

  router.post('/site/add', ctrl.Site.add);
  router.get('/site/list', ctrl.Site.list);
  router.get('/site/listRecord', ctrl.Site.listRecord);
  router.post('/site/modify', ctrl.Site.modify);
  router.post('/site/delete', ctrl.Site.delete);
  router.get('/site/refresh', ctrl.Site.refresh);
  router.get('/site/search', ctrl.Site.search);
  router.post('/site/pushTorrent', ctrl.Site.pushTorrent);
  router.get('/site/listSite', ctrl.Site.listSite);
  router.get('/site/overview', ctrl.Site.overview);

  router.get('/downloader/list', ctrl.Client.list);
  router.get('/downloader/listTop10', ctrl.Client.listTop10);
  router.get('/downloader/listMainInfo', ctrl.Client.listMainInfo);
  router.get('/downloader/getSpeedPerTracker', ctrl.Client.getSpeedPerTracker);
  router.get('/downloader/getLogs', ctrl.Client.getLogs);
  router.post('/downloader/add', ctrl.Client.add);
  router.post('/downloader/modify', ctrl.Client.modify);
  router.post('/downloader/delete', ctrl.Client.delete);

  router.get('/script/list', ctrl.Script.list);
  router.post('/script/add', ctrl.Script.add);
  router.post('/script/modify', ctrl.Script.modify);
  router.post('/script/delete', ctrl.Script.delete);
  router.post('/script/run', ctrl.Script.run);

  router.get('/watch/list', ctrl.Watch.list);
  router.get('/watch/listHistory', ctrl.Watch.listHistory);
  router.post('/watch/add', ctrl.Watch.add);
  router.post('/watch/modify', ctrl.Watch.modify);
  router.post('/watch/delete', ctrl.Watch.delete);
  router.post('/watch/deleteRecord', ctrl.Watch.deleteRecord);

  router.get('/rss/list', ctrl.Rss.list);
  router.post('/rss/add', ctrl.Rss.add);
  router.post('/rss/dryrun', ctrl.Rss.dryrun);
  router.post('/rss/modify', ctrl.Rss.modify);
  router.post('/rss/delete', ctrl.Rss.delete);
  router.post('/rss/deleteRecord', ctrl.Rss.deleteRecord);
  router.post('/rss/mikanSearch', ctrl.Rss.mikanSearch);
  router.post('/rss/mikanPush', ctrl.Rss.mikanPush);

  router.get('/subscribe/list', ctrl.Douban.list);
  router.post('/subscribe/add', ctrl.Douban.add);
  router.post('/subscribe/modify', ctrl.Douban.modify);
  router.post('/subscribe/delete', ctrl.Douban.delete);
  router.get('/subscribe/listHistory', ctrl.Douban.listHistory);
  router.get('/subscribe/listWishes', ctrl.Douban.listWishes);
  router.get('/subscribe/getWish', ctrl.Douban.getWish);
  router.get('/subscribe/deleteWish', ctrl.Douban.deleteWish);
  router.get('/subscribe/refreshWish', ctrl.Douban.refreshWish);
  router.post('/subscribe/editWish', ctrl.Douban.editWish);
  router.get('/subscribe/deleteRecord', ctrl.Douban.deleteRecord);
  router.post('/subscribe/refresh', ctrl.Douban.refreshWishes);
  router.get('/subscribe/relink', ctrl.Douban.relink);
  router.get('/subscribe/search', ctrl.Douban.search);
  router.post('/subscribe/addWish', ctrl.Douban.addWish);

  router.get('/deleteRule/list', ctrl.DeleteRule.list);
  router.post('/deleteRule/add', ctrl.DeleteRule.add);
  router.post('/deleteRule/modify', ctrl.DeleteRule.modify);
  router.post('/deleteRule/delete', ctrl.DeleteRule.delete);

  router.get('/selectRule/list', ctrl.RaceRule.list);
  router.post('/selectRule/add', ctrl.RaceRule.add);
  router.post('/selectRule/modify', ctrl.RaceRule.modify);
  router.post('/selectRule/delete', ctrl.RaceRule.delete);

  router.get('/raceRuleSet/list', ctrl.RaceRuleSet.list);
  router.post('/raceRuleSet/add', ctrl.RaceRuleSet.add);
  router.post('/raceRuleSet/modify', ctrl.RaceRuleSet.modify);
  router.post('/raceRuleSet/delete', ctrl.RaceRuleSet.delete);

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
  router.get('/torrent/getBulkLinkList', ctrl.Torrent.getBulkLinkList);
  router.get('/torrent/scrapeName', ctrl.Torrent.scrapeName);
  router.get('/torrent/getDelInfo', ctrl.Torrent.getDelInfo);
  router.post('/torrent/link', ctrl.Torrent.link);
  router.post('/torrent/deleteTorrent', ctrl.Torrent.deleteTorrent);

  router.get('/log/get', ctrl.Log.get);
  router.get('/log/clear', ctrl.Log.clear);

  router.get('/setting/get', ctrl.Setting.get);
  router.get('/setting/getRunInfo', ctrl.Setting.getRunInfo);
  router.get('/setting/getTrackerFlowHistory', ctrl.Setting.getTrackerFlowHistory);
  router.get('/setting/getTorrentHistorySetting', ctrl.Setting.getTorrentHistorySetting);
  router.get('/setting/getTorrentMixSetting', ctrl.Setting.getTorrentMixSetting);
  router.get('/setting/getTorrentPushSetting', ctrl.Setting.getTorrentPushSetting);
  router.get('/setting/getSitePushSetting', ctrl.Setting.getSitePushSetting);
  router.get('/setting/getBackground.less', ctrl.Setting.getBackground);
  router.post('/setting/modify', ctrl.Setting.modify);
  router.post('/setting/modifyTorrentHistorySetting', ctrl.Setting.modifyTorrentHistorySetting);
  router.post('/setting/modifyTorrentMixSetting', ctrl.Setting.modifyTorrentMixSetting);
  router.post('/setting/modifyTorrentPushSetting', ctrl.Setting.modifyTorrentPushSetting);
  router.post('/setting/modifySitePushSetting', ctrl.Setting.modifySitePushSetting);
  router.get('/setting/backupVertex', ctrl.Setting.backupVertex);
  router.post('/setting/restoreVertex', ctrl.Setting.restoreVertex);
  router.get('/setting/getCss.css', ctrl.Setting.getCss);
  router.post('/setting/loginMTeam', ctrl.Setting.loginMTeam);
  router.post('/setting/networkTest', ctrl.Setting.networkTest);
  router.get('/setting/getHosts', ctrl.Setting.getHosts);
  router.post('/setting/save', ctrl.Setting.save);
  router.get('/setting/export', ctrl.Setting.export);
  router.get('/setting/import', ctrl.Setting.import);
  router.get('/setting/getProxy', ctrl.Setting.getProxy);
  router.post('/setting/saveProxy', ctrl.Setting.saveProxy);

  router.all('/openapi/:apiKey/plex', ctrl.Webhook.plex);
  router.all('/openapi/:apiKey/emby', ctrl.Webhook.emby);
  router.all('/openapi/:apiKey/jellyfin', ctrl.Webhook.jellyfin);
  router.all('/openapi/:apiKey/wechat', ctrl.Webhook.wechat);
  router.all('/openapi/:apiKey/slack', ctrl.Webhook.slack);

  router.all('/openapi/:apiKey/widget', ctrl.OpenApi.widget);
  router.all('/openapi/:apiKey/siteInfo', ctrl.OpenApi.siteInfo);

  app.use('/api', router);
  app.use('/proxy/client/:client', clientProxy);
  app.use('/proxy/site/:site', siteProxy);
  app.use('/assets/styles/theme.less', (req, res) => {
    const _path = path.join(__dirname, '../static/assets/styles/' + (global.theme || 'follow') + '.less');
    if (!_path.startsWith(path.join(__dirname, '../static/'))) {
      res.status(404);
      return res.end('Not Found');
    }
    return res.download(_path, (err) => {
      if (!err) return;
      logger.error(err);
      res.status(404);
      return res.end('Not Found');
    });
  });
  app.use('*', (req, res, next) => {
    const pathname = req._parsedOriginalUrl.pathname;
    if (pathname === '/favicon.ico') {
      res.status(404);
      return res.end('Not Found');
    }
    if (pathname.startsWith('/assets') || pathname.startsWith('/workbox') || pathname.startsWith('/service-worker.js')) {
      const _path = path.join(__dirname, '../static', pathname);
      if (!_path.startsWith(path.join(__dirname, '../static/'))) {
        res.status(404);
        return res.end('Not Found');
      }
      return res.download(_path, (err) => {
        if (!err) return;
        logger.error(err);
        res.status(404);
        return res.end('Not Found');
      });
    }
    try {
      let indexHTML = fs.readFileSync(path.join(__dirname, '../static/index.html'), 'utf-8');
      if (global.theme === 'dark') {
        indexHTML = indexHTML.replace('<meta name="theme-color" content="#0099E3">', '<meta name="theme-color" content="#000">');
      }
      indexHTML = indexHTML.replace('VERTEX-THEME', global.theme);
      res.send(indexHTML);
    } catch (err) {
      logger.error(err);
      res.status(404);
      res.end('Not Found');
    }
  });
};
