const util = require('util');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const md5 = require('md5-node');
const request = require('request');
const Database = require('better-sqlite3');

const logger = require('./logger');
const scrape = require('./scrape');

const db = new Database(path.join(__dirname, '../db/sql.db'));

for (const k of Object.keys(util)) {
  exports[k] = util[k];
}

exports.getRecords = async function (sql, options) {
  let _sql = sql;
  if (options) {
    options.forEach((item) => {
      _sql = _sql.replace(/\?/, item);
    });
  }
  logger.info('Get Records:', _sql);
  return db.prepare(sql).all();
};

exports.insertRecord = async function (sql, options) {
  let _sql = sql;
  if (options) {
    options.forEach((item) => {
      _sql = _sql.replace(/\?/, item);
    });
  }
  logger.info('Insert Record:', _sql);
  return db.prepare(sql).run(...options);
};

exports.getRecord = async function (sql, options) {
  let _sql = sql;
  if (options) {
    options.forEach((item) => {
      _sql = _sql.replace(/\?/, item);
    });
  }
  logger.info('Get Record:', _sql);
  return db.prepare(sql).get(...options);
};

const _importJson = function (path) {
  const jsonString = fs.readFileSync(path, { encoding: 'utf-8' });
  return JSON.parse(jsonString);
};

exports.scrapeFree = scrape.free;
exports.scrapeHr = scrape.hr;

exports.requestPromise = util.promisify(request);
exports.exec = util.promisify(require('child_process').exec);
exports.uuid = uuid;
exports.md5 = md5;

exports.listBot = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/telegram/bot'));
  const botList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      botList.push(_importJson(path.join(__dirname, '../data/telegram/bot', file)));
    }
  }
  return botList;
};

exports.listChannel = function () {
  const files = fs.readdirSync(path.join(__dirname, '../data/telegram/channel'));
  const channelList = [];
  for (const file of files) {
    if (path.extname(file) === '.json') {
      channelList.push(_importJson(path.join(__dirname, '../data/telegram/channel', file)));
    }
  }
  return channelList;
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
