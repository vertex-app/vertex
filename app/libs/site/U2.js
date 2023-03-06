const util = require('../util');
const moment = require('moment');

class Site {
  constructor () {
    this.name = 'U2';
    this.downloadLink = 'https://u2.dmhy.org//download.php?id={ID}';
    this.url = 'https://u2.dmhy.org/';
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument(this.index, false, 10);
    // 用户名
    info.username = document.querySelector('a[href*=userdetails] b bdo').innerHTML;
    // uid
    info.uid = +document.querySelector('a[href*=userdetails]').href.match(/id=(\d+)/)[1];
    // 上传
    info.upload = document.querySelector('span[class=color_uploaded]').nextSibling.nodeValue.trim();
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelector('span[class=color_downloaded]').nextSibling.nodeValue.trim();
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelector('img[class=arrowup]').nextElementSibling.innerHTML.trim();
    // 下载
    info.leeching = +(document.querySelector('a[href*=leech]') ? document.querySelector('a[href*=leech]').innerHTML : +document.querySelector('img[class=arrowdown]').nextSibling.nodeValue.replace(')', ''));
    // 做种体积
    const seedingDocument = await this._getDocument(`${this.index}getusertorrentlistajax.php?userid=${info.uid}&type=seeding`, true);
    const seedingSize = (seedingDocument.match(/大小&nbsp;(\d+\.\d+ [KMGTP]iB)/) || [0, '0 B'])[1];
    info.seedingSize = util.calSize(...seedingSize.split(' '));
    return info;
  };

  async searchTorrent (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`${this.index}torrents.php?notnewword=1&search=${encodeURIComponent(keyword)}&notnewword=1`);
    const torrents = document.querySelectorAll('.torrents > tbody > tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class~="embedded"] > a[href*="details"]').innerHTML.trim();
      torrent.subtitle = (_torrent.querySelector('span[class=tooltip]').innerHTML || '').trim();
      torrent.category = _torrent.querySelector('td a[href*=cat]').innerHTML.trim();
      torrent.link = this.index + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('span[class=red]')).innerHTML.trim().replace(',', '');
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[7]).innerHTML.trim().replace(',', '');
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[8]).innerHTML.trim().replace(',', '');
      torrent.size = _torrent.childNodes[5].innerHTML.trim().replace('<br>', ' ');
      torrent.time = moment(_torrent.childNodes[4].querySelector('time') ? _torrent.childNodes[4].querySelector('time').title : _torrent.childNodes[4].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('div[class*=tag]');
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
