const logger = require('../logger');
const util = require('../util');
const moment = require('moment');

const _api = async function (cookie, path, data, type = 'form') {
  logger.debug('M-Team, Wait 2.5s.');
  await util.sleep(2500);
  if (type === 'form') {
    const { body } = await util.requestPromise({
      url: `https://api.m-team.cc${path}`,
      method: 'POST',
      headers: {
        'x-api-key': cookie
      },
      formData: data,
      json: true
    });
    return body.data;
  }
  if (type === 'json') {
    const { body } = await util.requestPromise({
      url: `https://api.m-team.cc${path}`,
      method: 'POST',
      headers: {
        'x-api-key': cookie
      },
      body: data,
      json: true
    });
    return body.data;
  }
};

class Site {
  constructor () {
    this.name = 'MTeam';
    this.url = 'https://kp.m-team.cc/';
    this.id = 3;
  };

  async getInfo () {
    const info = {};
    const profile = await _api(this.cookie, '/api/member/profile', {}, 'json');
    if (!profile) {
      throw new Error('疑似登录状态失效, 请检查 Api Key');
    }
    // 用户名
    info.username = profile.username;
    // uid
    info.uid = profile.id;
    // 上传
    info.upload = profile.memberCount.uploaded;
    // 下载
    info.download = profile.memberCount.downloaded;

    const peerlist = await _api(this.cookie, '/api/tracker/myPeerStatus', {}, 'json');
    if (!peerlist) {
      throw new Error('疑似登录状态失效, 请检查 Api Key');
    }
    // 做种
    info.seeding = peerlist.seeder;
    // 下载
    info.leeching = peerlist.leecher;

    // 做种体积
    const seedinglist = [];
    let page = 1;
    const pageSize = 100;
    while (true) {
      const _seedinglist = await _api(this.cookie, '/api/member/getUserTorrentList', { userid: info.uid, type: 'SEEDING', pageNumber: page, pageSize }, 'json');
      if (!_seedinglist) {
        throw new Error('疑似登录状态失效, 请检查 Api Key');
      }
      for (const seeding of _seedinglist.data) {
        seedinglist.push(seeding);
      }
      page += 1;
      if (_seedinglist.data.length < pageSize) {
        break;
      }
    }
    info.seedingSize = 0;
    for (const seeding of seedinglist) {
      info.seedingSize += +seeding.torrent.size;
    }
    return info;
  };

  async searchTorrent (keyword) {
    const categorymap = {};
    const _categorylist = await _api(this.cookie, '/api/torrent/categoryList', {}, 'json');
    for (const category of _categorylist.list) {
      categorymap[category.id] = category;
    }
    const torrentList = [];
    const _torrentlist = await _api(this.cookie, '/api/torrent/search', { mode: 'normal', categories: [], keyword, pageNumber: 1, pageSize: 100 }, 'json');
    if (!_torrentlist) {
      throw new Error('疑似登录状态失效, 请检查 Api Key');
    }
    for (const _torrent of _torrentlist.data) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.name;
      torrent.subtitle = _torrent.smallDescr;
      torrent.category = categorymap[_torrent.category]?.nameChs || '';
      torrent.id = _torrent.id;
      torrent.link = this.siteUrl + `detail/${torrent.id}`;
      torrent.seeders = +_torrent.status.seeders;
      torrent.leechers = +_torrent.status.leechers;
      torrent.snatches = +_torrent.status.timesCompleted;
      torrent.size = +_torrent.size;
      torrent.time = moment(torrent.createdDate).unix();
      torrent.tags = [];
      if (+_torrent.labels & 1) {
        torrent.tags.push('DIY');
      }
      if (+_torrent.labels & 2) {
        torrent.tags.push('国配');
      }
      if (+_torrent.labels & 4) {
        torrent.tags.push('中字');
      }
      torrentList.push(torrent);
    }
    if (this.adult) {
      const _torrentlist = await _api(this.cookie, '/api/torrent/search', { mode: 'adult', categories: [], keyword, pageNumber: 1, pageSize: 100 }, 'json');
      if (!_torrentlist) {
        throw new Error('疑似登录状态失效, 请检查 Api Key');
      }
      for (const _torrent of _torrentlist.data) {
        const torrent = {};
        torrent.site = this.site;
        torrent.title = _torrent.name;
        torrent.subtitle = _torrent.smallDescr;
        torrent.category = categorymap[_torrent.category]?.nameChs || '';
        torrent.id = _torrent.id;
        torrent.link = this.siteUrl + `detail/${torrent.id}`;
        torrent.seeders = +_torrent.status.seeders;
        torrent.leechers = +_torrent.status.leechers;
        torrent.snatches = +_torrent.status.timesCompleted;
        torrent.size = +_torrent.size;
        torrent.time = moment(torrent.createdDate).unix();
        torrent.tags = [];
        if (+torrent.labels & 1) {
          torrent.tags.push('DIY');
        }
        if (+torrent.labels & 2) {
          torrent.tags.push('国配');
        }
        if (+torrent.labels & 4) {
          torrent.tags.push('中字');
        }
        torrentList.push(torrent);
      }
    }
    return {
      site: this.site,
      torrentList
    };
  };

  async getDownloadLink (link) {
    const tid = link.match(/\/(\d+)/)[1];
    const dltoken = await _api(this.cookie, '/api/torrent/genDlToken', { id: tid }, 'form');
    return dltoken;
  }
};
module.exports = Site;
