const util = require('../util');
const moment = require('moment');

class Site {
  constructor () {
    this.name = 'LemonHD';
    this.downloadLink = 'https://lemonhd.org/download.php?id={ID}';
    this.url = 'https://lemonhd.org/';
    this.id = 2;
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument(this.index, false, 10);
    // 用户名
    info.username = document.querySelector('a[href*=userdetails] b').innerHTML;
    // uid
    info.uid = +document.querySelector('a[href*=userdetails]').href.match(/id=(\d+)/)[1];
    // 上传
    info.upload = document.querySelectorAll('td[class="bottom nowrap"]')[6].innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelectorAll('td[class="bottom nowrap"]')[22].innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelectorAll('td[class="bottom nowrap"]')[8].innerHTML.split('<')[0];
    // 下载
    info.leeching = +document.querySelectorAll('td[class="bottom nowrap"]')[24].innerHTML.split('<')[0];
    // 做种体积
    const seedingDocument = await this._getDocument(`${this.index}userdetails.php?id=${info.uid}`, true);
    const seedingSize = (seedingDocument.match(/总做种体积: (\d+\.\d+ [KMGTP]B)/) || [0, '0 B'])[1].replace(/([KMGTP])B/, '$1iB');
    info.seedingSize = util.calSize(...seedingSize.split(' '));
    return info;
  };

  async searchTorrent (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`${this.index}torrents.php?notnewword=1&search=${encodeURIComponent(keyword)}&suggest=0&search_area=name`);
    const torrents = document.querySelectorAll('.torrents tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('a[href*="details_"] b').innerHTML.trim();
      torrent.subtitle = _torrent.children[2].children[1].innerHTML.trim();
      torrent.category = _torrent.querySelector('td img[class*=cat]').getAttribute('class').trim();
      torrent.link = this.index + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('a[href*=seeders] span') || _torrent.querySelector('td span[class="red"]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.children[7]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.children[8]).innerHTML.trim();
      torrent.size = _torrent.children[5].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[6].querySelector('span') ? _torrent.childNodes[6].querySelector('span').title : _torrent.childNodes[6].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('span[class~=tag]');
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
