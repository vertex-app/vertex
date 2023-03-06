const util = require('../util');
const moment = require('moment');

class Site {
  constructor () {
    this.name = 'HaresClub';
    this.downloadLink = 'https://club.hares.top/download.php?id={ID}';
    this.url = 'https://club.hares.top/';
    this.id = 1;
  };

  async getInfo () {
    const info = {};
    const document = await this._getDocument(this.index, false, 10);
    // 用户名
    info.username = document.querySelector('a[href*=userdetails] b,a[href*=userdetails] em').innerHTML;
    // uid
    info.uid = +document.querySelector('a[href*=userdetails]').href.match(/id=(\d+)/)[1];
    // 上传
    info.upload = document.querySelector('i[class="fa fa-arrow-up text-success fa-fw"]').nextElementSibling.innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelector('i[class="fa fa-arrow-down layui-font-orange fa-fw"]').nextElementSibling.innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelector('i[class="fas fa-upload text-success fa-fw"]').nextElementSibling.innerHTML.trim();
    // 下载
    info.leeching = +document.querySelector('i[class="fas fa-download layui-font-red fa-fw"]').nextElementSibling.innerHTML.trim();
    // 做种体积
    const { body: seedingInfo } = await util.requestPromise({
      url: `${this.index}getusertorrentlistajax.php?page=1&limit=50&uid=${info.uid}&type=seeding`,
      headers: {
        cookie: this.cookie,
        accept: 'application/json, text/javascript, */*; q=0.01'
      }
    });
    const seedingSize = JSON.parse(seedingInfo).size.replace(/([KMGTP])B/, '$1iB');
    info.seedingSize = util.calSize(...seedingSize.split(' '));
    return info;
  };

  async searchTorrent (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`${this.index}torrents.php?notnewword=1&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search=${encodeURIComponent(keyword)}&search_mode=0&incldead=0&spstate=0&check_state=0&can_claim=0&inclbookmarked=0`);
    const torrents = document.querySelectorAll('.torrents tbody tr');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('.layui-torrents-title-width a').title.trim();
      torrent.subtitle = _torrent.querySelector('.layui-torrents-descr-width').innerHTML.trim();
      torrent.category = _torrent.querySelector('a[href*="cat"] img').title;
      torrent.link = this.index + _torrent.querySelector('.layui-torrents-title-width a').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('a[href*=seeders]') || _torrent.childNodes[6].querySelector('span')).innerHTML.trim() || 0;
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[7]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[8]).innerHTML.trim();
      torrent.size = _torrent.childNodes[5].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[4].querySelector('span') ? _torrent.childNodes[4].querySelector('span').title : _torrent.childNodes[4].innerHTML.replace(/<br>/, ' ')).unix();
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
  }
};
module.exports = Site;
