const util = require('../util');
const moment = require('moment');

class Site {
  constructor () {
    this.name = 'NYPT';
    this.downloadLink = 'https://nanyangpt.com/download.php?id={ID}';
    this.url = 'https://nanyangpt.com/';
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument(this.index, false, 10);
    // 用户名
    info.username = document.querySelector('a[href*=userdetails] b').innerHTML;
    // uid
    info.uid = +document.querySelector('a[href*=userdetails]').href.match(/id=(\d+)/)[1];
    // uid
    info.uid = +document.querySelector('a[href*=userdetails]').href.match(/id=(\d+)/)[1];
    // 上传
    info.upload = document.querySelector('img[class=arrowup]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelector('img[class=arrowdown]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelector('img[title=当前做种]').nextSibling.nodeValue.trim();
    // 下载
    info.leeching = +document.querySelector('img[title=当前下载]').nextSibling.nodeValue.trim();
    // 做种体积
    const seedingDocument = await this._getDocument(`${this.index}getusertorrentlistajax.php?userid=${info.uid}&type=seeding`, true);
    const seedingSize = (seedingDocument.replace(/&nbsp;/g, ' ').match(/条记录 - (\d+\.\d+ [KMGTP]B)/) || [0, '0 B'])[1].replace(/([KMGTP])B/, '$1iB');
    info.seedingSize = util.calSize(...seedingSize.split(' '));
    return info;
  };

  async searchTorrent (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`${this.index}torrents.php?notnewword=1&incldead=0&spstate=0&picktype=0&inclbookmarked=0&keepseed=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrents > tbody > tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="embedded"] > a[href*="details"]').title.trim();
      const subtitle = _torrent.querySelector('.torrentname > tbody > tr .embedded br');
      torrent.subtitle = subtitle ? subtitle.nextSibling.nodeValue.trim() : '';
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
      torrentList.push(torrent);
    }
    return {
      site: this.site,
      torrentList
    };
  };
};
module.exports = Site;
