const util = require('../util');
const moment = require('moment');

class Site {
  constructor () {
    this.name = 'SpringSunDay';
    this.downloadLink = 'https://springsunday.net/download.php?id={ID}';
    this.url = 'https://springsunday.net/';
    this.id = 11;
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument('https://springsunday.net/', false, 10);
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b span').innerHTML;
    // 上传
    info.upload = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelector('img[class=arrowup]').nextSibling.nodeValue.trim();
    // 下载
    info.leeching = +document.querySelector('img[class=arrowdown]').nextSibling.nodeValue.trim();
    return info;
  };

  async searchTorrent (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://springsunday.net/torrents.php?incldead=0&spstate=0&pick=0&inclbookmarked=0&exclusive=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrents tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="embedded"] > a[href*="details"]').title.trim();
      torrent.subtitle = (_torrent.querySelector('.torrentname > tbody > tr .embedded a[href*=torrents]:last-of-type') || _torrent.querySelector('.torrentname > tbody > tr .embedded br')).nextSibling.nodeValue.trim();
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = 'https://springsunday.net/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[15]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[17]).innerHTML.trim();
      torrent.size = _torrent.childNodes[11].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[9].querySelector('span') ? _torrent.childNodes[9].querySelector('span').title : _torrent.childNodes[9].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('a[href*=torrents] span');
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