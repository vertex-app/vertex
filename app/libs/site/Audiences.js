const util = require('../util');
const moment = require('moment');

class Site {
  constructor () {
    this.name = 'Audiences';
    this.downloadLink = 'https://audiences.me/download.php?id={ID}';
    this.url = 'https://audiences.me/';
    this.id = 14;
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument(this.index, false, 10);
    // 用户名
    info.username = document.querySelector('a[href*=userdetails] b').innerHTML;
    // uid
    info.uid = +document.querySelector('a[href*=userdetails]').href.match(/id=(\d+)/)[1];
    // 站点改版后统计信息挂在 data-uploader-stats 上 (JSON, 按 tone 区分), 不再有 color_uploaded/arrowup 元素
    const stats = JSON.parse(document.querySelector('[data-uploader-stats]').getAttribute('data-uploader-stats'))
      .reduce((_stats, item) => { _stats[item.tone] = item.value.trim(); return _stats; }, {});
    // 上传
    info.upload = util.calSize(...stats.uploaded.replace(/(\w)B/, '$1iB').split(' '));
    // 下载
    info.download = util.calSize(...stats.downloaded.replace(/(\w)B/, '$1iB').split(' '));
    // 做种/下载, 形如 "↑ 105 / ↓ 0"
    info.seeding = +stats.active.replace(/[^\d/]/g, '').split('/')[0];
    info.leeching = +stats.active.replace(/[^\d/]/g, '').split('/')[1];
    // 做种体积, 站点已移除 getusertorrentlistajax.php 的内容, 改为累加做种列表里的 data-size-bytes
    info.seedingSize = await this._getSeedingSize();
    return info;
  };

  async _getSeedingSize () {
    const torrentIds = new Set();
    let seedingSize = 0;
    for (let page = 0; page < 50; page++) {
      const document = await this._getDocument(`${this.index}torrents.php?inclbookmarked=0&mytorrent=seeding&incldead=0&spstate=0&page=${page}`, false, 300);
      const torrents = document.querySelectorAll('#torrenttable tr[data-torrent-id]');
      // 翻页越界时站点会重复返回最后一页, 靠已在集合中的 id 判断到底
      const newTorrents = [...torrents].filter(torrent => !torrentIds.has(torrent.getAttribute('data-torrent-id')));
      if (!newTorrents.length) break;
      for (const torrent of newTorrents) {
        torrentIds.add(torrent.getAttribute('data-torrent-id'));
        seedingSize += +(torrent.getAttribute('data-size-bytes') || 0);
      }
      if (torrents.length < 100) break;
    }
    return seedingSize;
  };

  async searchTorrent (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`${this.index}torrents.php?notnewword=1&incldead=0&spstate=0&inclbookmarked=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0&tag=`);
    const torrents = document.querySelectorAll('#torrenttable tr[data-torrent-id]');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.getAttribute('data-title').trim();
      torrent.subtitle = _torrent.querySelector('.torrent-subtitle-text').textContent.trim();
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = this.index + _torrent.querySelector('.torrent-title-cell a[href*="details"]').getAttribute('href').trim();
      torrent.id = +_torrent.getAttribute('data-torrent-id');
      torrent.seeders = +_torrent.getAttribute('data-seeders');
      torrent.leechers = +_torrent.getAttribute('data-leechers');
      torrent.snatches = +_torrent.getAttribute('data-times-completed');
      torrent.size = +_torrent.getAttribute('data-size-bytes');
      torrent.time = moment(+_torrent.getAttribute('data-added-ts')).unix();
      torrent.tags = [];
      // 不能用 [class*=tags], 会命中外层的 torrent-subtitle-tags
      const tagsDom = _torrent.querySelectorAll('span.tags');
      for (const tag of tagsDom) {
        torrent.tags.push(tag.innerHTML.trim());
      }
      torrentList.push(torrent);
    }
    return {
      site: this.site,
      torrentList
    };
  };
};
module.exports = Site;
