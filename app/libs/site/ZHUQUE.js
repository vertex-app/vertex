const util = require('../util');

class Site {
  constructor () {
    this.name = 'ZHUQUE';
    this.url = 'https://zhuque.in/';
    this.downloadLink = this.url + 'api/torrent/download/{ID}';
    this.id = 23;
  };

  async getInfo () {
    const info = {};
    const _document = await this._getDocument(this.index + 'index');
    const csrf = _document.querySelector('meta[name=x-csrf-token]').content;
    const document = (await util.requestPromise({
      url: this.index + 'api/user/getInfo',
      headers: {
        cookie: this.cookie,
        'x-csrf-token': csrf
      }
    })).body;
    const _info = JSON.parse(document).data;
    // 用户名
    info.username = _info.username;
    // uid
    info.uid = _info.id;
    // 上传
    info.upload = _info.upload;
    // 下载
    info.download = _info.download;
    // 做种
    info.seeding = _info.seeding;
    // 下载
    info.leeching = _info.leeching;
    // 做种体积
    info.seedingSize = _info.seedSize;
    return info;
  };

  async searchTorrent (keyword) {
    const _document = await this._getDocument(this.index + 'index');
    const csrf = _document.querySelector('meta[name=x-csrf-token]').content;
    const _options = (await util.requestPromise({
      url: `${this.index}api/torrent/option`,
      headers: {
        cookie: this.cookie,
        'x-csrf-token': csrf
      }
    })).body;
    const options = {};
    for (const o of JSON.parse(_options).data.option) {
      options[o.id] = o.name;
    }
    const ret = (await util.requestPromise({
      url: `${this.index}api/torrent/advancedSearch`,
      method: 'POST',
      headers: {
        cookie: this.cookie,
        'x-csrf-token': csrf
      },
      json: {
        type: 'title',
        keyword
      }
    })).body;
    const torrentList = [];
    const { torrents, torrentKey } = ret.data;
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.title;
      torrent.subtitle = _torrent.subtitle;
      torrent.category = options[_torrent.category];
      torrent.link = this.index + 'torrent/info/' + _torrent.id;
      torrent.downloadLink = this.index + 'api/torrent/download/' + _torrent.id + '/' + torrentKey;
      torrent.id = _torrent.id;
      torrent.seeders = _torrent.seeding;
      torrent.leechers = _torrent.leeching;
      torrent.snatches = _torrent.complete;
      torrent.size = _torrent.size;
      torrent.time = _torrent.upload_time;
      torrent.tags = _torrent.tags.map(item => options[item]);
      torrentList.push(torrent);
    }
    return {
      site: this.site,
      torrentList
    };
  };
};
module.exports = Site;
