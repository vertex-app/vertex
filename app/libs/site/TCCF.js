const util = require('../util');

class Site {
  constructor () {
    this.name = 'TCCF';
    this.url = 'https://et8.org/';
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
};
module.exports = Site;
