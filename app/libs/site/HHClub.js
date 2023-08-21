const util = require('../util');
const moment = require('moment');

class Site {
  constructor () {
    this.name = 'HHClub';
    this.downloadLink = 'https://hhanclub.top/download.php?id={ID}';
    this.url = 'https://hhanclub.top/';
    this.id = 22;
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument(this.index, false, 10);
    // 用户名
    info.username = document.querySelector('a[href*=userdetails] b').innerHTML;
    // uid
    info.uid = +document.querySelector('a[href*=userdetails]').href.match(/id=(\d+)/)[1];
    // 上传
    info.upload = document.querySelector('img[src*=icon-user-upload]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelector('img[src*=icon-user-download]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelector('img[src*=icon-now-upload]').nextSibling.nodeValue.trim();
    // 下载
    info.leeching = +document.querySelector('img[src*=icon-downloading]').nextSibling.nodeValue.trim();
    // 做种体积
    const seedingDocument = await this._getDocument(`${this.index}getusertorrentlistajax.php?userid=${info.uid}&type=seeding`, true);
    const seedingSize = (seedingDocument.match(/总大小\uff1a(\d+\.\d+ [KMGTP]B)/) || [0, '0 B'])[1].replace(/([KMGTP])B/, '$1iB');
    info.seedingSize = util.calSize(...seedingSize.split(' '));
    return info;
  };

  async searchTorrent (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`${this.index}torrents.php?notnewword=1&incldead=0&spstate=0&inclbookmarked=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0&tag=`);
    const torrents = [...document.querySelectorAll('#mainContent .torrents-table > .m-auto > .m-auto.flex > div')].slice(4);
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('.torrent-title a[href*="details"]').innerHTML.trim();
      torrent.subtitle = _torrent.querySelector('.torrent-title > div > div > div').innerHTML.trim();
      torrent.category = _torrent.querySelector('a[href*=cat] img').src.match(/icon-(.*).svg$/)[1];
      torrent.link = this.index + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelectorAll('.torrent-info-text > a')[0]?.innerHTML || _torrent.querySelectorAll('.torrent-info-text')[2].innerHTML).trim().replace(',', '');
      torrent.leechers = +(_torrent.querySelectorAll('.torrent-info-text > a')[1]?.innerHTML || _torrent.querySelectorAll('.torrent-info-text')[3].innerHTML).trim().replace(',', '');
      torrent.snatches = +(_torrent.querySelectorAll('.torrent-info-text')[4].innerHTML).trim().replace(',', '');
      torrent.size = _torrent.querySelectorAll('.torrent-info-text')[0].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.querySelectorAll('.torrent-info-text > span')[0].title.trim().replace(',', '')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('span[style*=background]');
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
