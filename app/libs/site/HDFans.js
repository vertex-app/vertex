const util = require('../util');

class Site {
  constructor () {
    this.name = 'HDFans';
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument('https://hdfans.org/', false, 10);
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b').innerHTML;
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
};
module.exports = Site;
