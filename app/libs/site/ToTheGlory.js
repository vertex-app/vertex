const util = require('../util');
const moment = require('moment');

class Site {
  constructor () {
    this.name = 'ToTheGlory';
    this.url = 'https://totheglory.im/';
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument(this.index, false, 10);
    // 用户名
    info.username = document.querySelector('a[href*=userdetails]').innerHTML;
    // uid
    info.uid = +document.querySelector('a[href*=userdetails]').href.match(/id=(\d+)/)[1];
    // 上传
    info.upload = document.querySelector('font[color=green]').nextElementSibling.children[0].innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelector('font[color=darkred]').nextElementSibling.children[0].innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelector('img[src="/pic/arrowup.gif"]').nextElementSibling.textContent;
    // 下载
    info.leeching = +document.querySelector('img[src="/pic/arrowdown.gif"]').nextElementSibling.textContent;
    // 做种体积
    const seedingDocument = await this._getDocument(`${this.index}userdetails.php?id=${info.uid}`);
    const seedingTorrent = [...seedingDocument.querySelectorAll('#ka2 tr')];
    seedingTorrent.shift();
    info.seedingSize = 0;
    for (const torrent of seedingTorrent) {
      const siteStr = torrent.childNodes[4].innerHTML.replace('<br>', ' ').replace(/([KMGTP])B/, '$1iB');
      info.seedingSize += util.calSize(...siteStr.split(' '));
    }
    return info;
  };

  async searchTorrent (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`${this.index}browse.php?search_field=${encodeURIComponent(keyword)}&c=M`);
    const torrents = document.querySelectorAll('#torrent_table tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = (_torrent.querySelector('div[class="name_left"] a[href*="/t/"] b font') || _torrent.querySelector('div[class="name_left"] a[href*="/t/"] b')).childNodes[0].nodeValue.trim();
      const subtitle = (_torrent.querySelector('div[class="name_left"] a[href*="/t/"] b font span') || _torrent.querySelector('div[class="name_left"] a[href*="/t/"] b span'));
      torrent.subtitle = (subtitle ? subtitle.innerHTML.trim() : '');
      if (subtitle.nextSibling) {
        let node = subtitle.nextSibling;
        while (node) {
          if (node.nodeName === 'BR' || !node.nodeValue) {
            node = node.nextSibling;
          } else {
            torrent.subtitle += ' ' + node.nodeValue.trim();
            node = node.nextSibling;
          }
        }
      }
      torrent.category = _torrent.querySelector('td a[href*=cat] img').alt.trim();
      torrent.link = this.index + _torrent.querySelector('a[href*="/t/"]').href.trim();
      torrent.downloadLink = this.index + _torrent.querySelector('a[href*="/dl/"]').href;
      torrent.id = +torrent.link.match(/\/t\/(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=toseeders] a font') || _torrent.querySelector('a[href*=toseeders] font') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      const zeroLeechers = _torrent.innerHTML.match(/\/\n0/);
      if (zeroLeechers) {
        torrent.leechers = 0;
      } else {
        torrent.leechers = +_torrent.querySelector('a[href*=todlers]').innerHTML.trim();
      }
      torrent.snatches = +_torrent.innerHTML.match(/(\d+)<br>次/)[1];
      torrent.size = _torrent.innerHTML.match(/\d+\.*\d+<br>[PTGMK]B/)[0].replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.innerHTML.match(/\d{4}-\d{2}-\d{2}<br>\d{2}:\d{2}:\d{2}/)[0].replace('<br>', ' ')).unix();
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
