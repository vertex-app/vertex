const util = require('util');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const tar = require('tar');
const md5 = require('md5-node');
const request = require('request');
const Database = require('better-sqlite3');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const url = require('url');

const logger = require('./logger');
const scrape = require('./scrape');

const db = new Database(path.join(__dirname, '../db/sql.db'));
puppeteer.use(StealthPlugin());

let browser;

for (const k of Object.keys(util)) {
  exports[k] = util[k];
}

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
exports.requestPromise = async function (options) {
  if (typeof options === 'string') {
    return await exports._requestPromise({
      url: options,
      headers: {
        'User-Agent': global.userAgent || 'Vertex'
      }
    });
  }
  if (!options.headers) {
    options.headers = {};
  };
  options.headers['User-Agent'] = global.userAgent || 'Vertex';
  const res = await exports._requestPromise(options);
  if (res.body && typeof res.body === 'string' && (res.body.indexOf('jschl-answer') !== -1 || res.body.indexOf('cloudflare-static') !== -1)) {
    logger.debug(new url.URL(options.url).hostname, '疑似遇到 5s 盾, 启用 Puppeteer 抓取页面....');
    return await exports.requestUsePuppeteer(options);
  }
  return res;
};

exports.requestUsePuppeteer = async function (options) {
  if (!browser || browser.process().exitCode === 0) {
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      args: ['--remote-debugging-port=9222', '--no-sandbox'],
      headless: false
    });
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });
  await page.setUserAgent(options.headers['User-Agent']);
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
  await page.goto(options.url, {});
  await page.waitFor(10000);
  const body = await page.content();
  await page.close();
  if ((await browser.pages()).length === 1) {
    logger.info('Close Browser!!!');
    await browser.close();
  }
  return {
    body
  };
};

exports.exec = util.promisify(require('child_process').exec);
exports.uuid = uuid;
exports.md5 = md5;
exports.tar = tar;

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
      rssList.push(_importJson(path.join(__dirname, '../data/rss', file)));
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
