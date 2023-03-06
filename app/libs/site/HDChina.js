const util = require('../util');
const moment = require('moment');
const { JSDOM } = require('jsdom');

class Site {
  constructor () {
    this.name = 'HDChina';
    this.downloadLink = 'https://hdchina.org/download.php?id={ID}';
    this.url = 'https://hdchina.org/';
    this.id = 13;
  };

  async getInfo () {
    const info = {};
    this.cookie = this.cookie.split(';').filter(item => item.trim().indexOf('PHPSESSID') !== 0).join(';');
    const { dom: document, cookie } = await this._getDocument(this.index, false, 10, true);
    // 用户名
    info.username = document.querySelector('a[href*=userdetails] b').innerHTML;
    // uid
    info.uid = +document.querySelector('a[href*=userdetails]').href.match(/id=(\d+)/)[1];
    // 基本信息
    const baseInfo = document.querySelectorAll('div[class="userinfo"] p')[2].innerHTML;
    // 上传
    info.upload = baseInfo.match(/\d*\.\d* \wB/g)[0].replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = baseInfo.match(/\d*\.\d* \wB/g)[1].replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelector('i[class="fas fa-arrow-up"]').nextSibling.nodeValue.trim();
    // 下载
    info.leeching = +document.querySelector('i[class="fas fa-arrow-down"]').nextSibling.nodeValue.trim().replace(')', '');
    // 做种体积
    const csrf = document.querySelector('meta[name=x-csrf]').content;
    const sessid = ((cookie || ['']).join(' ').split(';').filter(item => item.indexOf('PHPSESSID') === 0) || [''])[0];
    const _cookie = this.cookie.split(';').filter(item => item.trim().indexOf('PHPSESSID') !== 0).concat([sessid]).join(';');
    const { body: stats } = await util.requestPromise({
      url: `${this.index}ajax_getusertorrentlist.php`,
      method: 'POST',
      headers: {
        cookie: _cookie
      },
      form: {
        userid: info.uid,
        type: 'seeding',
        csrf
      }
    });
    const statsJson = JSON.parse(stats);
    const seedingDocument = new JSDOM(statsJson.message).window.document;
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
    const document = await this._getDocument(`${this.index}torrents.php?notnewword=1&incldead=1&spstate=0&inclbookmarked=0&seeders=&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrent_list tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="t_name"] a[href*="details"]').title.trim();
      torrent.subtitle = _torrent.querySelector('td[class="t_name"] h4').innerHTML.trim();
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = this.index + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.downloadLink = this.index + _torrent.querySelector('a[href*="download.php"]').href;
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('span[class=red]')).innerHTML.trim().replace(',', '');
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[9]).innerHTML.trim().replace(',', '');
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches]') || _torrent.childNodes[11]).innerHTML.trim().replace(',', '');
      torrent.size = _torrent.childNodes[6].innerHTML.trim().replace('&nbsp;', ' ').replace(/([KMGPT])B/, '$1iB');
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

  async getDownloadLink (link) {
    const document = await this._getDocument(link);
    const url = document.querySelector('a[title="下载种子"]').href;
    const downloadLink = url.startsWith('http') ? url : this.siteUrl + url;
    return downloadLink;
  }
};
module.exports = Site;
