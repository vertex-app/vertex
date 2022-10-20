const util = require('../util');

class Site {
  constructor () {
    this.name = 'GPW';
    this.url = 'https://greatposterwall.com/';
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument(`${this.index}/user.php`, false, 10);
    // 用户名
    info.username = document.querySelector('a[href^="user.php?id"]').innerHTML;
    // uid
    info.uid = document.querySelector('a[href^="torrents.php?type=seeding&userid="]').href.match(/userid=(\d+)/)[1];
    // 上传
    info.upload = document.querySelector('a[href^="torrents.php?type=seeding&userid="] span').innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelector('a[href^="torrents.php?type=leeching&userid="] span').innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));

    // ajax
    const { body: stats } = await util.requestPromise({
      url: `${this.index}ajax.php?action=community_stats&userid=${info.uid}`,
      headers: {
        cookie: this.cookie
      }
    });
    const statsJson = JSON.parse(stats);
    // 做种
    info.seeding = +statsJson.response.seeding;
    // 下载
    info.leeching = +statsJson.response.leeching;
    // 做种体积
    const seedingDocument = await this._getDocument(`${this.index}torrents.php?type=seeding&userid=${info.uid}`);
    const seedingTorrent = [...seedingDocument.querySelectorAll('.td_size.number_column')];
    info.seedingSize = 0;
    for (const torrent of seedingTorrent) {
      const siteStr = torrent.innerHTML.replace(/([KMGTP])B/, '$1iB');
      info.seedingSize += util.calSize(...siteStr.split(' '));
    }
    return info;
  };
};
module.exports = Site;
