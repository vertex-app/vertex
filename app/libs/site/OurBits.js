const util = require('../util');
const moment = require('moment');

class Site {
  constructor () {
    this.name = 'OurBits';
    this.downloadLink = 'https://ourbits.club/download.php?id={ID}';
    this.url = 'https://ourbits.club/';
    this.id = 5;
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument(this.index, false, 10);
    // 用户名
    info.username = document.querySelector('a[href*=userdetails] b').innerHTML;
    // uid
    info.uid = +document.querySelector('a[href*=userdetails]').href.match(/id=(\d+)/)[1];
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
    // 做种体积
    const seedingDocument = await this._getDocument(`${this.index}getusertorrentlistajax.php?userid=${info.uid}&type=seeding`);
    const seedingTorrent = [...seedingDocument.querySelectorAll('tr')];
    seedingTorrent.shift();
    info.seedingSize = 0;
    for (const torrent of seedingTorrent) {
      const siteStr = torrent.childNodes[3].innerHTML.replace('<br>', ' ').replace(/([KMGTP])B/, '$1iB');
      info.seedingSize += util.calSize(...siteStr.split(' '));
    }
    return info;
  };

  async searchTorrent (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`${this.index}torrents.php?notnewword=1&incldead=1&spstate=0&inclbookmarked=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrents tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="embedded"] > a[href*="details"]').title.trim();
      const subtitleDiv = _torrent.querySelector('.torrentname > tbody > tr .embedded');
      if (subtitleDiv.lastChild.getAttribute) {
        torrent.subtitle = subtitleDiv.childNodes[subtitleDiv.childNodes.length - 2].nodeValue.trim();
      } else {
        torrent.subtitle = subtitleDiv.lastChild.nodeValue.trim();
      }
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = this.index + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('span[class=red]')).innerHTML.trim().replace(',', '');
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[9]).innerHTML.trim().replace(',', '');
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[11]).innerHTML.trim().replace(',', '');
      torrent.size = _torrent.childNodes[6].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[5].querySelector('span') ? _torrent.childNodes[5].querySelector('span').title : _torrent.childNodes[5].innerHTML.replace(/<br>/, ' ')).unix();
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
