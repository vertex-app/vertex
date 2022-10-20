const logger = require('../logger');
const util = require('../util');

class Site {
  constructor () {
    this.name = 'MikanProject';
    this.url = 'https://mikanani.me/';
    this.id = 101;
  };

  async getInfo () {
    const info = {};
    // 用户名
    info.username = 'MikanProject';
    // uid
    info.uid = 0;
    // 上传
    info.upload = 0;
    // 下载
    info.download = 0;
    // 做种
    info.seeding = 0;
    // 下载
    info.leeching = 0;
    // 做种体积
    info.seedingSize = 0;
    return info;
  };

  async searchTorrent (keyword) {
    const torrentList = [];
    const torrents = await util.mikanSearch(keyword);
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.name;
      torrent.subtitle = _torrent.name;
      torrent.category = 'anime';
      torrent.link = _torrent.link;
      torrent.downloadLink = _torrent.url;
      torrent.id = _torrent.id;
      torrent.seeders = 99;
      torrent.leechers = 999;
      torrent.snatches = 999;
      torrent.size = _torrent.size;
      torrent.time = _torrent.pubTime;
      torrent.tags = [];
      torrentList.push(torrent);
    }
    return {
      site: this.site,
      torrentList
    };
  };

  async getDownloadLink (link) {
    const document = await this._getDocument(link);
    const url = document.querySelector('a[href*="Download"]').href;
    const downloadLink = url.startsWith('http') ? url : 'https://mikanani.me' + url;
    logger.info(downloadLink);
    return downloadLink;
  }
};
module.exports = Site;
