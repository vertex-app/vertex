const util = require('util');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const tar = require('tar');
const md5 = require('md5-node');
const CryptoJS = require('crypto-js');
const cron = require('node-cron');
const request = require('request');
const Database = require('better-sqlite3');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const url = require('url');
const { JSDOM } = require('jsdom');
const moment = require('moment');
const redlock = require('./redlock');

const logger = require('./logger');
const scrape = require('./scrape');

const db = new Database(path.join(__dirname, '../db/sql.db'));
puppeteer.use(StealthPlugin());

let browser;

const ttl = 15000;

for (const k of Object.keys(util)) {
  exports[k] = util[k];
}

exports.redlock = redlock;

exports.getRecords = async function (sql, options = []) {
  let _sql = sql;
  if (options) {
    options.forEach((item) => {
      _sql = _sql.replace(/\?/, item);
    });
  }
  logger.debug('Get Records:', _sql);
  return db.prepare(sql).all(...options);
};

exports.runRecord = async function (sql, options = []) {
  let _sql = sql;
  if (options) {
    options.forEach((item) => {
      _sql = _sql.replace(/\?/, item);
    });
  }
  logger.debug('Run Record:', _sql);
  return db.prepare(sql).run(...options);
};

exports.getRecord = async function (sql, options = []) {
  let _sql = sql;
  if (options) {
    options.forEach((item) => {
      _sql = _sql.replace(/\?/, item);
    });
  }
  logger.debug('Get Record:', _sql);
  return db.prepare(sql).get(...options);
};

const _importJson = function (path) {
  const jsonString = fs.readFileSync(path, { encoding: 'utf-8' });
  return JSON.parse(jsonString);
};

exports.scrapeFree = scrape.free;
exports.scrapeHr = scrape.hr;

exports._requestPromise = util.promisify(request);
exports.requestPromise = async function (_options, usePuppeteer = true) {
  let options;
  if (typeof _options === 'string') {
    options = {
      url: _options
    };
  } else {
    options = { ..._options };
  }
  if (!options.headers) {
    options.headers = {};
  };
  options.headers['User-Agent'] = global.userAgent || 'Vertex';
  if (!options.timeout) {
    options.timeout = 120000;
  }
  if (global.proxy) {
    const host = new URL(options.url).host;
    if (global.domains.split('\n').indexOf(host) !== -1) {
      options.proxy = global.proxy;
    }
  }
  if (global.trustAllCerts) {
    options.rejectUnauthorized = !global.trustAllCerts;
  }
  const res = await exports._requestPromise(options);
  if (usePuppeteer && res.body && typeof res.body === 'string' && (res.body.indexOf('trk_jschal_js') !== -1 || res.body.indexOf('jschl-answer') !== -1 || (res.body.indexOf('cloudflare-static') !== -1 && res.body.indexOf('email-decode.min.js') === -1))) {
    logger.info(new url.URL(options.url).hostname, '疑似遇到 5s 盾, 启用 Puppeteer 抓取页面....');
    return await exports.requestUsePuppeteer(options);
  }
  return res;
};

exports.requestUsePuppeteer = async function (options) {
  const lock = await exports.redlock.lock('vertex:puppeteer', ttl);
  logger.debug('locked');
  try {
    if (!browser || browser.process().exitCode === 0) {
      browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        args: [
          '--no-sandbox'
        ],
        headless: false
      });
    }
    lock.unlock();
    logger.debug('unlocked');
  } catch (e) {
    logger.error(e);
    lock.unlock();
    logger.debug('unlocked');
  }
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 800, height: 600 });
    await page.setUserAgent(options.headers['User-Agent']);
    if (options.headers.cookie) {
      const cookieList = options.headers.cookie.split(';').map(i => i.trim())
        .filter(i => i !== '')
        .map(i => {
          return {
            name: i.split('=')[0],
            value: i.split('=')[1],
            domain: new url.URL(options.url).hostname
          };
        });
      if (cookieList.length !== 0) await page.setCookie(...cookieList);
    }
    await page.goto(options.url, {});
    await page.waitForTimeout(30000);
    const body = await page.content();
    await page.close();
    if ((await browser.pages()).length === 1) {
      logger.info('关闭 Puppeteer....');
      await browser.close();
    }
    return {
      body
    };
  } catch (e) {
    logger.error('Puppeteer 报错:\n', e);
    await page.close();
    if ((await browser.pages()).length === 1) {
      logger.info('关闭 Puppeteer....');
      await browser.close();
    }
    return {
      body: ''
    };
  }
};

exports.exec = util.promisify(require('child_process').exec);
exports.uuid = uuid;
exports.md5 = md5;
exports.tar = tar;

exports.formatQSString = function (qs) {
  return Object.keys(qs).filter(item => qs[item]).map(item => `${item}=${encodeURIComponent(qs[item])}`).join('&');
};

exports.scrapeNameByFile = async function (_filename, type, _year = false, useFullname = false) {
  const filename = _filename.replace(/[[\]]/g, '');
  let searchKey = filename.split(/19\d\d|20\d\d|S\d\d/)[0]
    .replace(/[a-zA-z]+TV(\dK)?\.?/, '')
    .replace(/(Jade)\.?/, '')
    .replace(/[\u4e00-\u9fa5\uff01\uff1a]+\d+[\u4e00-\u9fa5\uff01\uff1a]+/g, '')
    .replace(/[\u4e00-\u9fa5\uff01\uff1a。:?？，,·・]/g, '')
    .replace(/\./g, ' ').trim();
  if (filename.match(/^[\u4e00-\u9fa5·]+[A-RT-Za-rt-z]*[\u4e00-\u9fa5·]+/)) {
    searchKey = filename.match(/^[\u4e00-\u9fa5·]+[A-RT-Za-rt-z]*[\u4e00-\u9fa5·]+/)[0].replace(/[^\u4e00-\u9fa5A-Za-z]/g, ' ').replace(/第.*季/g, '');
  }
  let year = filename.match(/[^d](19\d{2}|20\d{2})[^d]/);
  const season = filename.match(/S0[^1]/);
  if (useFullname) {
    searchKey = _filename.replace(/\.\d{4}$/, '');
    year = _filename.match(/\.(\d{4})$/, '');
  }
  if (year) {
    year = year[1];
  }
  if (season) {
    year = undefined;
  }
  const qs = {
    year,
    name: searchKey,
    type,
    apiKey: global.panelKey
  };
  const url = 'https://dash.vertex-app.top/api/tmdb/search?' + exports.formatQSString(qs);
  const res = await exports.requestPromise(url);
  let body = JSON.parse(res.body);
  if (!body.success) {
    logger.error(filename, searchKey, body);
    throw new Error('请求 TMDB 信息返回有误, 请重试');
  }
  body = body.data;
  body.results = body.results.sort((a, b) => b.popularity - a.popularity);
  logger.debug('根据文件名抓取影视剧名', filename, searchKey, body.results[0]?.name || body.results[0]?.title || '');
  logger.debug(`请求信息 名: ${searchKey}, 年份: ${year}, 类型: ${type}`);
  if (_year) {
    return {
      name: body.results[0]?.name || body.results[0]?.title || '',
      year: (body.results[0]?.release_date || body.results[0]?.first_air_date || '').split('-')[0],
      type: type || body.results[0]?.media_type
    };
  }
  return body.results[0]?.name || body.results[0]?.title || '';
};

exports.scrapeEpisodeByFilename = function (_filename, ignoreKeys = '') {
  let filename = _filename
    .replace(/【/g, '[')
    .replace(/】/g, ']');
  ignoreKeys.split(',').forEach((item) => { filename = filename.replace(new RegExp(item, 'gi'), ''); });
  let episode = +(filename.match(/[Ee][Pp]?(\d+)[. ]+/) || [])[1];
  if (!episode) {
    episode = +(filename.match(/\[(\d+)[Vv]?\d?\]/) || [])[1];
  }
  if (!episode) {
    episode = +(filename.match(/第(\d+)[话話集]/) || [])[1];
  }
  if (!episode) {
    const episodes = filename
      .replace(/((mp)|(MP)|(Mp))4/g, '')
      .replace(/\d+[KkFfPpi年月日期季]+/g, '')
      .replace(/\d+\.\d+/g, '')
      .replace(/[xXHh]26[45]/g, '')
      .replace(/[Ss]\d+/g, '')
      .replace(/((1st)|(2nd)|(3rd))/g, '')
      .replace(/\[[.\dA-Za-z_-]*\]/g, '')
      .replace(/\d+[MmBbGg]/g, '')
      .replace(/\d*[Xx]\d+/g, '')
      .match(/\d+/g)
      ?.map(item => +item.match(/\d+/))
      .filter(item => [0, 480, 720, 1080, 576, 2160, 1920].indexOf(item) === -1) || [];
    if (episodes.length === 1) {
      episode = episodes[0];
    }
  };
  return episode;
};

exports.listSite = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/site'));
  const list = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      list.push(_importJson(path.join(__dirname, '../data/site', file)));
    }
  }
  return list;
};

exports.listPush = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/push'));
  const list = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      list.push(_importJson(path.join(__dirname, '../data/push', file)));
    }
  }
  return list;
};

exports.listClient = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/client'));
  const clientList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      clientList.push(_importJson(path.join(__dirname, '../data/client', file)));
    }
  }
  return clientList;
};

exports.listServer = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/server'));
  const serverList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      serverList.push(_importJson(path.join(__dirname, '../data/server', file)));
    }
  }
  return serverList;
};

exports.listRss = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/rss'));
  const rssList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      const rss = _importJson(path.join(__dirname, '../data/rss', file));
      if (rss.rssUrl && !rss.rssUrls) {
        rss.rssUrls = [rss.rssUrl];
      }
      rssList.push(rss);
    }
  }
  return rssList;
};

exports.listDeleteRule = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/rule/delete'));
  const deleteRuleList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      deleteRuleList.push(_importJson(path.join(__dirname, '../data/rule/delete', file)));
    }
  }
  return deleteRuleList;
};

exports.listLinkRule = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/rule/link'));
  const linkRuleList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      linkRuleList.push(_importJson(path.join(__dirname, '../data/rule/link', file)));
    }
  }
  return linkRuleList;
};

exports.listRssRule = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/rule/rss'));
  const rssRuleList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      rssRuleList.push(_importJson(path.join(__dirname, '../data/rule/rss', file)));
    }
  }
  return rssRuleList;
};

exports.listRaceRule = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/rule/race'));
  const raceRuleList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      raceRuleList.push(_importJson(path.join(__dirname, '../data/rule/race', file)));
    }
  }
  return raceRuleList;
};

exports.listRaceRuleSet = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/rule/raceSet'));
  const raceRuleSetList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      raceRuleSetList.push(_importJson(path.join(__dirname, '../data/rule/raceSet', file)));
    }
  }
  return raceRuleSetList;
};

exports.listDouban = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/douban'));
  const DoubanList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      const douban = _importJson(path.join(__dirname, '../data/douban', file));
      if (douban.enable === undefined) {
        douban.enable = true;
      }
      DoubanList.push(douban);
    }
  }
  return DoubanList;
};

exports.listDoubanSet = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/douban/set'));
  const doubanSetList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      doubanSetList.push(_importJson(path.join(__dirname, '../data/douban/set', file)));
    }
  }
  return doubanSetList;
};

exports.listCrontabJavaScript = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/script'));
  const scriptList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      scriptList.push(_importJson(path.join(__dirname, '../data/script', file)));
    }
  }
  return scriptList;
};

exports.listWatch = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/watch'));
  const watchList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      watchList.push(_importJson(path.join(__dirname, '../data/watch', file)));
    }
  }
  return watchList;
};

exports.listWatchSet = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/watch/set'));
  const watchSetList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      watchSetList.push(_importJson(path.join(__dirname, '../data/watch/set', file)));
    }
  }
  return watchSetList;
};

exports.listIRC = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/irc'));
  const ircList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      ircList.push(_importJson(path.join(__dirname, '../data/irc', file)));
    }
  }
  return ircList;
};

exports.getLinkMapping = function () {
  return _importJson(path.join(__dirname, '../data/link-mapping.json'));
};

exports.saveLinkMapping = function () {
  const mappingPath = path.join(__dirname, '../data/link-mapping.json');
  return fs.writeFileSync(mappingPath, JSON.stringify(global.linkMapping, null, 2));
};

exports.formatSize = function (size) {
  if (size < 1024) {
    return `${size.toFixed(2)} Byte`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KiB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MiB`;
  }
  if (size < 1024 * 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024 / 1024).toFixed(3)} GiB`;
  }
  if (size < 1024 * 1024 * 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024 / 1024 / 1024).toFixed(3)} TiB`;
  }
  if (size < 1024 * 1024 * 1024 * 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024 / 1024 / 1024 / 1024).toFixed(3)} PiB`;
  }
};

exports.calSize = function (size, unit) {
  const unitMap = {
    KiB: 1024,
    MiB: 1024 * 1024,
    GiB: 1024 * 1024 * 1024,
    TiB: 1024 * 1024 * 1024 * 1024,
    PiB: 1024 * 1024 * 1024 * 1024 * 1024
  };
  return +size * (unitMap[unit] || 1);
};

exports.formatTime = function (ms) {
  const d = parseInt(ms / (24 * 3600 * 1000));
  const h = parseInt(ms / (3600 * 1000) % 24);
  const m = parseInt(ms / (60 * 1000) % 60);
  const s = parseInt(ms / (1000) % 60);
  const ss = parseInt(ms % 1000);
  let str = '';
  if (d) {
    str += `${d < 10 ? '0' + d : d}:`;
  }
  if (h) {
    str += `${h < 10 ? '0' + h : h}:`;
  }
  if (m) {
    str += `${m < 10 ? '0' + m : m}:`;
  }
  if (s) {
    str += `${s < 10 ? '0' + s : s}:`;
  }
  str += `${ss < 10 ? '00' + ss : ss < 100 ? '0' + ss : ss}`;
  return str;
};

exports.sleep = function (time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return resolve('ping');
    }, time);
  });
};

exports.randomColor = function () {
  return '#' + (new Array(6)).fill(1).map(() => '0123456789abcdef'[parseInt(Math.random() * 15)]).join('');
};

exports.mikanSearch = async function (name) {
  const url = `https://mikanani.me/Home/Search?searchstr=${encodeURIComponent(name)}`;
  const html = (await exports.requestPromise({
    url: url
  })).body;
  const document = new JSDOM(html).window.document;
  const torrentDoms = document.querySelectorAll('.js-search-results-row');
  const torrents = [];
  for (const _torrent of torrentDoms) {
    const torrent = {
      size: 0,
      name: '',
      hash: '',
      id: 0,
      url: '',
      link: ''
    };
    torrent.name = _torrent.querySelector('.magnet-link-wrap').innerHTML.trim();
    torrent.size = _torrent.children[1].innerHTML.trim();
    if (torrent.size) {
      torrent.size = exports.calSize(...torrent.size.replace(/ ?([MGKT])B/, ' $1iB').replace(/,/g, '').split(' '));
    } else {
      torrent.size = 0;
    }
    const link = _torrent.querySelector('.magnet-link-wrap').href.trim();
    torrent.link = 'https://mikanani.me' + link;
    torrent.hash = link.match(/Episode\/(.*)/)[1];
    torrent.id = torrent.hash;
    torrent.url = 'https://mikanani.me' + _torrent.querySelector('a[href*=Download]').href.trim();
    torrent.pubTime = moment(_torrent.children[2].innerHTML.trim().replace(/\//g, '-')).unix();
    torrents.push(torrent);
  }
  return torrents;
};

exports.syncCookieCloud = async (cc) => {
  const { uuid, passwd, host, sites, douban } = cc;
  const { body } = await exports.requestPromise(`${host}/get/${uuid}`);
  const { encrypted } = JSON.parse(body);
  const key = CryptoJS.MD5(uuid + '-' + passwd).toString().substring(0, 16);
  const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
  const parsed = JSON.parse(decrypted);
  const cookies = Object.values(parsed.cookie_data).flat().map(item => ({
    domain: item.domain,
    cookie: `${item.name}=${item.value}`
  }));

  const _sites = exports.listSite();
  const _doubans = exports.listDouban();
  for (const s of sites) {
    // 判断站点是否启用
    const __site = _sites.filter(item => item.name === s)[0];
    if (!__site || !global.runningSite[s]) {
      continue;
    }
    // 拿到 host
    const sitehost = new URL(global.runningSite[s].index).host;
    // 过滤出 cookie
    const cookie = cookies.filter(item => item.domain.replace(/^\./, '') === sitehost).map(item => item.cookie).join(';');
    if (__site.cookie === cookie) {
      logger.info('站点', __site.name, 'Cookie 未改变');
      continue;
    }
    __site.cookie = cookie;
    // 写入文件
    fs.writeFileSync(path.join(__dirname, '../data/site', __site.name + '.json'), JSON.stringify(__site, null, 2));
    global.runningSite[s].cookie = __site.cookie;
    logger.info('站点', __site.name, '同步 Cookie');
  }

  // douban
  if (douban) {
    for (const d of Object.values(global.runningDouban)) {
      const _douban = _doubans.filter(item => item.id === d.id)[0];
      const cookie = cookies.filter(item => item.domain.endsWith('douban.com')).map(item => item.cookie).join(';');
      if (_douban.cookie === cookie) {
        logger.info('豆瓣 Cookie 未改变');
        continue;
      }
      _douban.cookie = cookie;
      global.runningDouban[_douban.id].cookie = cookie;
      fs.writeFileSync(path.join(__dirname, '../data/douban/', d.id + '.json'), JSON.stringify(_douban, null, 2));
      logger.info('豆瓣同步 Cookie');
    }
  }
};

exports.initCookieCloud = function () {
  const setting = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/setting.json')));
  if (global.cookiecloud) {
    global.cookiecloud.stop();
    delete global.cookiecloud;
  }
  if (!setting.cookiecloud?.enable) {
    return;
  }
  const cc = setting.cookiecloud;
  global.cookiecloud = cron.schedule(cc.cron, async () => {
    try {
      await exports.syncCookieCloud(cc);
    } catch (e) {
      logger.error('cookiecloud 同步失败: \n', e);
    };
  });
  // init
};
