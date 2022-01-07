const Multipart = require('connect-multiparty');
const session = require('express-session');
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

    '/login'
  ];
  if (req.session.user && ['/', '/login'].includes(pathname)) {
    return res.redirect(302, '/home');
  }
  if (excludePath.includes(pathname) || pathname.startsWith('/assets') || pathname === '/favicon.ico') {
    return next();
  }
  if (!req.session.user && !pathname.startsWith('/api')) {
    return res.redirect(302, '/login');
  }
  if (!req.session.user) {
    res.status(401);
    return res.send('NEED_AUTH');
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
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(multipartMiddleware);
  app.use(setIp);
  app.use(checkAuth);

  router.get('/user/login', ctrl.User.login);
  router.get('/server/netSpeed', ctrl.Server.netSpeed);
  router.get('/server/cpuUse', ctrl.Server.cpuUse);
  router.get('/server/diskUse', ctrl.Server.diskUse);
  router.get('/server/memoryUse', ctrl.Server.memoryUse);
  router.get('/server/vnstat', ctrl.Server.vnstat);

  router.post('/telegram/addBot', ctrl.Telegram.addBot);
  router.post('/telegram/addChannel', ctrl.Telegram.addChannel);
  router.get('/telegram/listBot', ctrl.Telegram.listBot);
  router.get('/telegram/listChannel', ctrl.Telegram.listChannel);
  router.post('/telegram/modifyBot', ctrl.Telegram.modifyBot);
  router.post('/telegram/modifyChannel', ctrl.Telegram.modifyChannel);
  router.post('/telegram/deleteBot', ctrl.Telegram.deleteBot);
  router.post('/telegram/deleteChannel', ctrl.Telegram.deleteChannel);

  router.get('/client/list', ctrl.Client.list);
  router.post('/client/add', ctrl.Client.add);
  router.post('/client/modify', ctrl.Client.modify);
  router.post('/client/delete', ctrl.Client.delete);

  router.get('/rss/list', ctrl.Rss.list);
  router.post('/rss/add', ctrl.Rss.add);
  router.post('/rss/modify', ctrl.Rss.modify);
  router.post('/rss/delete', ctrl.Rss.delete);

  router.get('/deleteRule/list', ctrl.DeleteRule.list);
  router.post('/deleteRule/add', ctrl.DeleteRule.add);
  router.post('/deleteRule/modify', ctrl.DeleteRule.modify);
  router.post('/deleteRule/delete', ctrl.DeleteRule.delete);

  router.get('/rssRule/list', ctrl.RssRule.list);
  router.post('/rssRule/add', ctrl.RssRule.add);
  router.post('/rssRule/modify', ctrl.RssRule.modify);
  router.post('/rssRule/delete', ctrl.RssRule.delete);

  router.get('/torrent/list', ctrl.Torrent.list);

  app.use('/api', router);
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
