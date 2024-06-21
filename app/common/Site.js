const logger = require('../libs/logger');
const util = require('../libs/util');
const cron = require('node-cron');
const moment = require('moment');
const redis = require('../libs/redis');
const { JSDOM } = require('jsdom');
const bencode = require('bencode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class Site {
  constructor (site) {
    this.cookie = site.cookie;
    this.site = site.name;
    this.priority = +site.priority || 0;
    this.adult = site.adult;
    this.pullRemoteTorrent = site.pullRemoteTorrent;
    this.rssUrl = site.rssUrl || '';
    this.maxRetryCount = +site.maxRetryCount || 5;
    this.getInfo = global.SITE.getInfoWrapper[this.site];
    this.searchTorrent = global.SITE.searchTorrentWrapper[this.site];
    this.getDownloadLink = global.SITE.getDownloadLinkWrapper[this.site];
    this.torrentDownloadLink = global.SITE.torrentDownloadLinkMap[this.site];
    this.siteUrl = global.SITE.siteUrlMap[this.site];
    this.index = global.SITE.siteUrlMap[this.site];
    this.siteId = global.SITE.siteIdMap[this.site];
    this.retryCount = 0;
    this.cron = site.cron || '0 */4 * * *';
    this.refreshJob = cron.schedule(this.cron, async () => { try { await this.refreshInfo(); } catch (e) { logger.error(e); } });
    this._init();
    logger.info('站点', this.site, '初始化完毕');
  };

  _getSum (a, b) {
    return a + b;
  };

  async _init () {
    const record = await util.getRecord('select * from sites where site = ? order by id desc limit 1', [this.site]) || {};
    this.info = {
      username: record.username,
      uid: record.uid,
      upload: record.upload,
      download: record.download,
      seedingSize: record.seeding_size,
      seeding: +record.seeding_num,
      updateTime: record.update_time,
      leeching: 0
    };
  }

  async _getDocument (url, origin = false, expire = 300, retCookies = false, headers) {
    const cache = await redis.get(`vertex:document:body:${url}`);
    if (!cache) {
      const res = (await util.requestPromise({
        url: url,
        headers: {
          cookie: this.cookie,
          ...headers
        }
      }));
      if (origin) return res.body;
      if (url.indexOf('getusertorrentlistajax') !== -1) {
        res.body = res.body
          .replace(/ *href=".*?"/g, '')
          .replace(/ *title=".*?"/g, '')
          .replace(/ *class=".*?"/g, '')
          .replace(/ *align=".*?"/g, '')
          .replace(/ *id=".*?"/g, '')
          .replace(/ *src=".*?"/g, '')
          .replace(/ *alt=".*?"/g, '')
          .replace(/ *color=".*?"/g, '')
          .replace(/ *type=".*?"/g, '')
          .replace(/ *onclick=".*?"/g, '')
          .replace(/ *width=".*?"/g, '')
          .replace(/ *<b>.*?<\/b>/g, '')
          .replace(/ *style=".*?"/g, '');
      }
      await redis.setWithExpire(`vertex:document:body:${url}`, res.body, expire);
      const dom = new JSDOM(res.body);
      if (retCookies) {
        return {
          dom: dom.window.document,
          cookie: res.headers['set-cookie']
        };
      }
      return dom.window.document;
    } else {
      if (origin) return cache;
      const dom = new JSDOM(cache);
      return dom.window.document;
    }
  };

  async _downloadTorrent (url) {
    const res = await util.requestPromise({
      url: url,
      method: 'GET',
      encoding: null,
      headers: {
        cookie: this.cookie
      }
    });
    const buffer = Buffer.from(res.body, 'utf-8');
    const torrent = bencode.decode(buffer);
    const size = torrent.info.length || torrent.info.files.map(i => i.length).reduce(this._getSum, 0);
    const fsHash = crypto.createHash('sha1');
    fsHash.update(bencode.encode(torrent.info));
    const md5 = fsHash.digest('md5');
    let hash = '';
    for (const v of md5) {
      hash += v < 16 ? '0' + v.toString(16) : v.toString(16);
    };
    const filepath = path.join(__dirname, '../../torrents', hash + '.torrent');
    fs.writeFileSync(filepath, buffer);
    return {
      filepath,
      hash,
      size,
      name: torrent.info.name.toString()
    };
  };

  async refreshInfo () {
    try {
      const info = await this.getInfo();
      info.updateTime = moment().startOf('hour').unix();
      logger.debug(this.site, '站点数据成功抓取,', '数据如下:\n', info);
      await util.runRecord('insert into sites (site, uid, username, upload, download, bonus, seeding_size, seeding_num, level, update_time) values (?, ? , ?, ?, ?, ?, ?, ?, ?, ?)', [this.site, info.uid || 0, info.username, info.upload, info.download, info.bonus || 0, info.seedingSize || 0, info.seeding, info.level || '', info.updateTime]);
      this.info = info;
      this.retryCount = 0;
    } catch (e) {
      logger.error(e);
      throw new Error(this.site + ' 站点数据抓取失败 (疑似是 Cookie 失效, 或绕过 CloudFlare 5s 盾失效)');
    }
    if (this.pullRemoteTorrent && global.panelKey) {
      const res = await util.requestPromise({
        url: 'https://dash.vertex-app.top/api/user/activatingSite',
        method: 'POST',
        json: {
          apiKey: global.panelKey,
          siteId: this.siteId
        }
      });
      try {
        const resStatus = res.body.success;
        if (!resStatus) {
          logger.error('激活站点失败: ', res.body);
        }
      } catch (e) {
        logger.error(res.body);
      }
    }
  };

  async search (keyword) {
    try {
      if (!this.searchTorrent) {
        logger.error(this.site, '暂不支持搜索功能');
        return {
          site: this.site,
          torrentList: []
        };
      }
      const result = await this.searchTorrent(keyword);
      result.torrentList.forEach(item => { item.sitePriority = this.priority; });
      return result;
    } catch (e) {
      logger.error(this.site, '种子列表抓取失败 (疑似是 Cookie 失效, 或绕过 CloudFlare 5s 盾失效),', '报错如下:\n', e);
      return {
        site: this.site,
        torrentList: []
      };
    }
  };

  async pushTorrentById (id, torrentLink, downloadLink, client, savePath, category, autoTMM, recordType, recordNote) {
    recordNote = recordNote || `搜索推送, 站点: ${this.id}`;
    if (!downloadLink) {
      const downloadLinkTemplate = this.torrentDownloadLink;
      if (this.getDownloadLink) {
        downloadLink = await this.getDownloadLink(torrentLink);
      } else {
        if (!downloadLinkTemplate) throw new Error(`站点 ${this.site} 暂时不支持推送种子!`);
        downloadLink = downloadLinkTemplate.replace(/{ID}/, id);
      }
    }
    let tryCount = 0;
    let torrentInfo = {};
    while (true) {
      try {
        torrentInfo = await this._downloadTorrent(downloadLink);
        break;
      } catch (e) {
        tryCount += 1;
        logger.error('下载种子失败第', tryCount, '次,', '失败信息: ', e.message);
        if (tryCount === 3) {
          throw new Error('下载失败次数达到限制, 停止本次下载任务');
        }
        logger.error('等待 2s 后重新尝试');
        await util.sleep(2000);
      }
    }
    const { filepath, hash, size, name } = torrentInfo;
    tryCount = 0;
    while (true) {
      try {
        await global.runningClient[client].addTorrentByTorrentFile(filepath, hash, false, 0, 0, savePath, category, autoTMM);
        break;
      } catch (e) {
        tryCount += 1;
        logger.error('推送失败第', tryCount, '次', '失败信息\n', e);
        if (tryCount === 5) {
          throw new Error('推送失败次数达到限制, 停止本次推送');
        }
      }
    }
    // 1: 添加 2: 拒绝 3: 错误 4: 搜索推送 6: 豆瓣推送 98: 4 完成 99: 6 完成
    await util.runRecord('INSERT INTO torrents (hash, name, size, rss_id, link, record_time, add_time, record_type, record_note) values (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [hash, name, size, this.site, torrentLink, moment().unix(), moment().unix(), recordType, recordNote]);
    return '推送成功, 种子 hash: ' + hash;
  }

  async destroy () {
    logger.info('销毁站点实例', this.site);
    this.refreshJob.stop();
    delete this.refreshJob;
    delete global.runningSite[this.site];
  };
};

module.exports = Site;
