const logger = require('../libs/logger');
const util = require('../libs/util');
const CronJob = require('cron').CronJob;
const moment = require('moment');
const redis = require('../libs/redis');
const { JSDOM } = require('jsdom');
const bencode = require('bencode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class Site {
  constructor (site) {
    this.ssh = null;
    this.refreshWrapper = {
      HaresClub: this._haresclub,
      CHDBits: this._chdbits,
      LemonHD: this._lemonhd,
      HDChina: this._hdchina,
      HDSky: this._hdsky,
      HDHome: this._hdhome,
      PTerClub: this._pterclub,
      Audiences: this._audiences,
      OurBits: this._ourbits,
      SpringSunDay: this._springsunday,
      MTeam: this._mteam,
      U2: this._u2,
      OpenCD: this._opencd,
      BeiTai: this._beitai,
      TCCF: this._tccf,
      TLFBits: this._tlfbits,
      PTMSG: this._ptmsg,
      HDFans: this._hdfans,
      DICMusic: this._dicmusic,
      GPW: this._gpw,
      BTSchool: this._btschool,
      TJUPT: this._tjupt,
      KeepFriends: this._keepfriends,
      ToTheGlory: this._totheglory
    };
    this.searchWrapper = {
      HaresClub: this._searchHaresclub,
      LemonHD: this._searchLemonhd,
      MTeam: this._searchMTeam,
      HDSky: this._searchHDSky,
      OurBits: this._searchOurbits,
      HDHome: this._searchHDHome,
      PTerClub: this._searchPterclub,
      BTSchool: this._searchBTSchool,
      TJUPT: this._searchTJUPT,
      KeepFriends: this._searchKeepfriends,
      SpringSunDay: this._searchSpringsunday,
      ToTheGlory: this._searchTotheglory
    };
    this.torrentDownloadLinkMap = {
      HaresClub: 'https://club.hares.top/download.php?id={ID}',
      LemonHD: 'https://lemonhd.org/download.php?id={ID}',
      MTeam: 'https://kp.m-team.cc/download.php?id={ID}&https=1',
      HDSky: 'https://hdsky.me/download.php?id={ID}',
      OurBits: 'https://ourbits.club/download.php?id={ID}',
      HDHome: 'https://hdhome.org/download.php?id={ID}',
      PTerClub: 'https://pterclub.com/download.php?id={ID}',
      BTSchool: 'https://pt.btschool.club/download.php?id={ID}',
      TJUPT: 'https://www.tjupt.org/download.php?id={ID}',
      KeepFriends: 'https://pt.keepfrds.com/download.php?id={ID}',
      SpringSunDay: 'https://springsunday.net/download.php?id={ID}',
      ToTheGlory: 'https://totheglory.im/dl/{ID}/{NUMBER}'
    };
    this.siteUrlMap = {
      HaresClub: 'https://club.hares.top/',
      LemonHD: 'https://lemonhd.org/',
      MTeam: 'https://kp.m-team.cc/',
      HDSky: 'https://hdsky.me/',
      OurBits: 'https://ourbits.club/',
      HDHome: 'https://hdhome.org/',
      PTerClub: 'https://pterclub.com/',
      BTSchool: 'https://pt.btschool.club/',
      TJUPT: 'https://www.tjupt.org/',
      KeepFriends: 'https://pt.keepfrds.com/',
      SpringSunDay: 'https://springsunday.net/',
      ToTheGlory: 'https://totheglory.im/'
    };
    this.cookie = site.cookie;
    this.site = site.name;
    this.siteUrl = this.siteUrlMap[this.site];
    this.maxRetryCount = +site.maxRetryCount || 5;
    this.retryCount = 0;
    this.cron = site.cron || '0 */4 * * *';
    this.refreshJob = new CronJob(this.cron, () => { try { this.refreshInfo(); } catch (e) {} });
    this.refreshJob.start();
    this._init();
  };

  _getSum (a, b) {
    return a + b;
  };

  async _init () {
    const record = await util.getRecord('select * from sites where site = ? order by id desc limit 1', [this.site]) || {};
    this.info = {
      username: record.username,
      uid: record.uid,
      upload: record.upload,
      download: record.download,
      seedingSize: record.seeding_size,
      seeding: record.seeding_num,
      updateTime: record.update_time,
      leeching: 0
    };
  }

  async _getDocument (url) {
    const cache = await redis.get(`vertex:document:body:${url}`);
    if (!cache) {
      const html = (await util.requestPromise({
        url: url,
        headers: {
          cookie: this.cookie
        }
      })).body;
      await redis.setWithExpire(`vertex:document:body:${url}`, html, 30);
      const dom = new JSDOM(html);
      return dom.window.document;
    } else {
      const dom = new JSDOM(cache);
      return dom.window.document;
    }
  };

  async _downloadTorrent (url) {
    const res = await util.requestPromise({
      url: url,
      method: 'GET',
      encoding: null,
      headers: {
        cookie: this.cookie
      }
    });
    const buffer = Buffer.from(res.body, 'utf-8');
    const torrent = bencode.decode(buffer);
    const size = torrent.info.length || torrent.info.files.map(i => i.length).reduce(this._getSum, 0);
    const fsHash = crypto.createHash('sha1');
    fsHash.update(bencode.encode(torrent.info));
    const md5 = fsHash.digest('md5');
    let hash = '';
    for (const v of md5) {
      hash += v < 16 ? '0' + v.toString(16) : v.toString(16);
    };
    const filepath = path.join(__dirname, '../../torrents', hash + '.torrent');
    fs.writeFileSync(filepath, buffer);
    return {
      filepath,
      hash,
      size,
      name: torrent.info.name.toString()
    };
  };

  // 白兔
  async _haresclub () {
    const info = {};
    const document = await this._getDocument('https://club.hares.top/');
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b,a[href^=userdetails] em').innerHTML;
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
    return info;
  };

  // CHDBits
  async _chdbits () {
    const info = {};
    const document = await this._getDocument('https://chdbits.co/');
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

  // HDSky
  async _hdsky () {
    const info = {};
    const document = await this._getDocument('https://hdsky.me/');
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

  // PTerClub
  async _pterclub () {
    const info = {};
    const document = await this._getDocument('https://pterclub.com/');
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b').innerHTML;
    // 彩虹 ID
    if (info.username.indexOf('</span>') !== -1) {
      info.username = info.username.match(/">.*?<\/span/g).map(item => item.replace(/">(.*?)<\/span/, '$1')).join('');
    }
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

  // HDHome
  async _hdhome () {
    const info = {};
    const document = await this._getDocument('https://hdhome.org/');
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

  // Audiences
  async _audiences () {
    const info = {};
    const document = await this._getDocument('https://audiences.me/');
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

  // OurBits
  async _ourbits () {
    const info = {};
    const document = await this._getDocument('https://ourbits.club/');
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

  // MTeam
  async _mteam () {
    const info = {};
    const document = await this._getDocument('https://kp.m-team.cc/');
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

  // BeiTai
  async _beitai () {
    const info = {};
    const document = await this._getDocument('https://www.beitai.pt/');
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

  // TCCF
  async _tccf () {
    const info = {};
    const document = await this._getDocument('https://et8.org/');
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

  // TLFBits
  async _tlfbits () {
    const info = {};
    const document = await this._getDocument('https://pt.eastgame.org/');
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

  // PTMSG
  async _ptmsg () {
    const info = {};
    const document = await this._getDocument('https://pt.msg.vg/');
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

  // BTSchool
  async _btschool () {
    const info = {};
    const document = await this._getDocument('https://pt.btschool.club/');
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

  // HDFans
  async _hdfans () {
    const info = {};
    const document = await this._getDocument('https://hdfans.org/');
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

  // OpenCD
  async _opencd () {
    const info = {};
    const document = await this._getDocument('https://open.cd/');
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b').innerHTML;
    // 上传
    info.upload = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelectorAll('font[class=color_downloaded]')[1].nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelector('img[class=arrowup]').nextSibling.nodeValue.trim();
    // 下载
    info.leeching = +document.querySelector('img[class=arrowdown]').nextSibling.nodeValue.trim();
    return info;
  };

  // U2
  async _u2 () {
    const info = {};
    const document = await this._getDocument('https://u2.dmhy.org/');
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b bdo').innerHTML;
    // 上传
    info.upload = document.querySelector('span[class=color_uploaded]').nextSibling.nodeValue.trim();
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelector('span[class=color_downloaded]').nextSibling.nodeValue.trim();
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelector('img[class=arrowup]').nextElementSibling.innerHTML.trim();
    // 下载
    info.leeching = +(document.querySelector('a[href*=leech]') ? document.querySelector('a[href*=leech]').innerHTML : +document.querySelector('img[class=arrowdown]').nextSibling.nodeValue.replace(')', ''));
    return info;
  };

  // SpringSunDay
  async _springsunday () {
    const info = {};
    const document = await this._getDocument('https://springsunday.net/');
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b span').innerHTML;
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

  // TJUPT
  async _tjupt () {
    const info = {};
    const document = await this._getDocument('https://www.tjupt.org/');
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b span').innerHTML;
    // 上传
    info.upload = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim();
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = 0;
    // 做种
    info.seeding = +document.querySelector('img[class=arrowup]').nextSibling.nodeValue.trim();
    // 下载
    info.leeching = +document.querySelector('img[class=arrowdown]').nextSibling.nodeValue.trim();
    return info;
  };

  // LemonHD
  async _lemonhd () {
    const info = {};
    const document = await this._getDocument('https://lemonhd.org/');
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b').innerHTML;
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
    return info;
  };

  // KeepFriends
  async _keepfriends () {
    const info = {};
    const document = await this._getDocument('https://pt.keepfrds.com/');
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

  // HDChina
  async _hdchina () {
    const info = {};
    const document = await this._getDocument('https://hdchina.org/');
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b').innerHTML;

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
    return info;
  };

  // DICMusic
  async _dicmusic () {
    const info = {};
    const document = await this._getDocument('https://dicmusic.club/user.php');
    // 用户名
    info.username = document.querySelector('a[href^="user.php"]').innerHTML;
    // uid
    info.uid = document.querySelector('a[href^="torrents.php?type=seeding&userid="]').href.match(/userid=(\d+)/)[1];
    // 上传
    info.upload = document.querySelector('a[href^="torrents.php?type=seeding&userid="]').nextElementSibling.innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelector('a[href^="torrents.php?type=leeching&userid="]').nextElementSibling.innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));

    // ajax
    const { body: stats } = await util.requestPromise({
      url: 'https://dicmusic.club/ajax.php?action=community_stats&userid=' + info.uid,
      headers: {
        cookie: this.cookie
      }
    });
    const statsJson = JSON.parse(stats);
    // 做种
    info.seeding = statsJson.response.seeding;
    // 下载
    info.leeching = statsJson.response.leeching;
    return info;
  };

  // GPW
  async _gpw () {
    const info = {};
    const document = await this._getDocument('https://greatposterwall.com/user.php');
    // 用户名
    info.username = document.querySelector('span[class=Header-profileName]').innerHTML;
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
      url: 'https://greatposterwall.com/ajax.php?action=community_stats&userid=' + info.uid,
      headers: {
        cookie: this.cookie
      }
    });
    const statsJson = JSON.parse(stats);
    // 做种
    info.seeding = statsJson.response.seeding;
    // 下载
    info.leeching = statsJson.response.leeching;
    return info;
  };

  // ToTheGlory
  async _totheglory () {
    const info = {};
    const document = await this._getDocument('https://totheglory.im/');
    // 用户名
    info.username = document.querySelector('a[href*=userdetails]').innerHTML;
    // 上传
    info.upload = document.querySelector('font[color=green]').nextElementSibling.children[0].innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.upload = util.calSize(...info.upload.split(' '));
    // 下载
    info.download = document.querySelector('font[color=darkred]').nextElementSibling.children[0].innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.download = util.calSize(...info.download.split(' '));
    // 做种
    info.seeding = +document.querySelector('img[src="/pic/arrowup.gif"]').nextSibling.nodeValue.trim();
    // 下载
    info.leeching = +document.querySelector('img[src="/pic/arrowdown.gif"]').nextSibling.nodeValue.trim();
    return info;
  };

  async refreshInfo () {
    try {
      const info = await this.refreshWrapper[this.site].call(this);
      info.updateTime = moment().startOf('hour').unix();
      logger.debug(this.site, '站点数据成功抓取,', '数据如下:\n', info);
      await util.runRecord('insert into sites (site, uid, username, upload, download, bonus, seeding_size, seeding_num, level, update_time) values (?, ? , ?, ?, ?, ?, ?, ?, ?, ?)', [this.site, info.uid || 0, info.username, info.upload, info.download, info.bonus || 0, info.seedingSize || 0, info.seeding, info.level || '', info.updateTime]);
      this.info = info;
      this.retryCount = 0;
    } catch (e) {
      logger.error(this.site, '站点数据抓取失败 (疑似是 Cookie 失效, 或绕过 CloudFlare 5s 盾失效),', '报错如下:\n', e);
      /*
      if (this.maxRetryCount && this.retryCount < this.maxRetryCount) {
        this.retryCount += 1;
        logger.error(this.site, '站点数据抓取失败, 等待 40s 后重新获取');
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 40000);
        return await this.refreshInfo();
      }
      */
      this.retryCount = 0;
      throw new Error('站点数据抓取失败 (疑似是 Cookie 失效, 或绕过 CloudFlare 5s 盾失效)');
    }
  };

  // search

  // HaresClub
  async _searchHaresclub (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://club.hares.top/torrents.php?search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search=${encodeURIComponent(keyword)}&search_mode=0&incldead=0&spstate=0&check_state=0&can_claim=0&inclbookmarked=0`);
    const torrents = document.querySelectorAll('.torrents tbody tr');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('.layui-torrents-title-width a').title.trim();
      torrent.subtitle = _torrent.querySelector('.layui-torrents-descr-width').innerHTML.trim();
      torrent.category = _torrent.querySelector('a[href*="cat"] img').title;
      torrent.link = 'https://club.hares.top/' + _torrent.querySelector('.layui-torrents-title-width a').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('a[href*=seeders]') || _torrent.childNodes[6]).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[7]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[8]).innerHTML.trim();
      torrent.size = _torrent.childNodes[5].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[4].querySelector('span') ? _torrent.childNodes[4].querySelector('span').title : _torrent.childNodes[4].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('span[class~=tags]');
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

  // LemonHD
  async _searchLemonhd (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://lemonhd.org/torrents.php?search=${encodeURIComponent(keyword)}&suggest=0&search_area=name`);
    const torrents = document.querySelectorAll('.torrents tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('a[href*="details_"] b').innerHTML.trim();
      torrent.subtitle = _torrent.children[2].children[1].innerHTML.trim();
      torrent.category = _torrent.querySelector('td img[class*=cat]').getAttribute('class').trim();
      torrent.link = 'https://lemonhd.org/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('a[href*=seeders] span') || _torrent.querySelector('td span[class="red"]')).innerHTML.trim();
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
  }

  // MTeam
  async _searchMTeam (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://kp.m-team.cc/torrents.php?incldead=1&spstate=0&inclbookmarked=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrents tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="embedded"] > a[href*="details"]').title.trim();
      torrent.subtitle = _torrent.querySelector('.torrentname > tbody > tr .embedded').lastChild.nodeValue;
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = 'https://kp.m-team.cc/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[9]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[11]).innerHTML.trim();
      torrent.size = _torrent.childNodes[6].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[5].querySelector('span') ? _torrent.childNodes[5].querySelector('span').title : _torrent.childNodes[5].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('img[class*=label]');
      for (const tag of tagsDom) {
        torrent.tags.push(tag.alt.trim());
      }
      torrentList.push(torrent);
    }
    return {
      site: this.site,
      torrentList
    };
  }

  // HDSky
  async _searchHDSky (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://hdsky.me/torrents.php?seeders=&incldead=1&spstate=0&inclbookmarked=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrents tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="embedded"] > a[href*="details"]').title.trim();
      torrent.subtitle = _torrent.querySelector('.torrentname > tbody > tr .embedded').lastChild.nodeValue.trim();
      if (torrent.subtitle === ']') {
        torrent.subtitle = (_torrent.querySelector('.torrentname > tbody > tr .embedded span[class=optiontag]:last-of-type') ||
          _torrent.querySelector('.torrentname > tbody > tr .embedded br')).nextSibling.nodeValue.trim().replace(/\[优惠剩余时间\uff1a/, '');
      }
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = 'https://hdsky.me/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.downloadLink = _torrent.querySelector('form[action*="download"]').action;
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[9]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[11]).innerHTML.trim();
      torrent.size = _torrent.childNodes[6].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[5].querySelector('span') ? _torrent.childNodes[5].querySelector('span').title : _torrent.childNodes[5].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('span[class*=optiontag]');
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

  // OurBits
  async _searchOurbits (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://ourbits.club/torrents.php?incldead=1&spstate=0&inclbookmarked=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
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
      torrent.link = 'https://ourbits.club/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[9]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[11]).innerHTML.trim();
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

  // HDHome
  async _searchHDHome (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://hdhome.org/torrents.php?incldead=1&spstate=0&inclbookmarked=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0&tag=`);
    const torrents = document.querySelectorAll('.torrents tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="embedded"] > a[href*="details"]').title.trim();
      torrent.subtitle = _torrent.querySelector('.torrentname > tbody > tr .embedded').lastChild.innerHTML.trim();
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = 'https://hdhome.org/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[9]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[11]).innerHTML.trim();
      torrent.size = _torrent.childNodes[6].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[5].querySelector('span') ? _torrent.childNodes[5].querySelector('span').title : _torrent.childNodes[5].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('span[class*=tags]');
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

  // PTerClub
  async _searchPterclub (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://pterclub.com/torrents.php?tag_exclusive=&tag_internal=&tag_mandarin=&tag_cantonese=&tag_doityourself=&tag_master=&incldead=1&spstate=0&inclbookmarked=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrents tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="embedded"] a[href*="details"]').title.trim();
      torrent.subtitle = _torrent.querySelector('.torrentname > tbody > tr .embedded > div > div:nth-child(2) span').innerHTML.trim();
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = 'https://pterclub.com/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[9]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[11]).innerHTML.trim();
      torrent.size = _torrent.childNodes[6].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[5].querySelector('span') ? _torrent.childNodes[5].querySelector('span').title : _torrent.childNodes[5].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('a[class*=torrents-tag]');
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

  // BTSchool
  async _searchBTSchool (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://pt.btschool.club/torrents.php?incldead=1&spstate=0&inclbookmarked=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrents tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="embedded"] > a[href*="details"]').title.trim();
      torrent.subtitle = (_torrent.querySelector('.torrentname > tbody > tr .embedded span[class*=label]:last-of-type') || _torrent.querySelector('.torrentname > tbody > tr .embedded br')).nextSibling.nodeValue.trim();
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = 'https://pt.btschool.club/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[9]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[11]).innerHTML.trim();
      torrent.size = _torrent.childNodes[6].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[5].querySelector('span') ? _torrent.childNodes[5].querySelector('span').title : _torrent.childNodes[5].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('span[class*=label]');
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

  // TJUPT
  async _searchTJUPT (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://www.tjupt.org/torrents.php?incldead=0&spstate=0&picktype=0&inclbookmarked=0&keepseed=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrents > tbody > tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="embedded"] > a[href*="details"]').title.trim();
      const subtitle = _torrent.querySelector('.torrentname > tbody > tr .embedded br');
      torrent.subtitle = subtitle ? subtitle.nextSibling.nodeValue.trim() : '';
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = 'https://www.tjupt.org/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[9]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[11]).innerHTML.trim();
      torrent.size = _torrent.childNodes[6].innerHTML.trim().replace('<br>', ' ');
      torrent.time = moment(_torrent.childNodes[5].querySelector('span') ? _torrent.childNodes[5].querySelector('span').title : _torrent.childNodes[5].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('font[class*=tag]');
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

  // KeepFriends
  async _searchKeepfriends (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://pt.keepfrds.com/torrents.php?incldead=1&spstate=0&inclbookmarked=0&option-torrents=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrents > tbody > tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      const title = _torrent.querySelector('.torrentname > tbody > tr .embedded br');
      torrent.title = title ? title.nextSibling.nodeValue.trim() : '';
      torrent.subtitle = _torrent.querySelector('td[class="embedded"] > a[href*="details"]').title.trim();
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = 'https://pt.keepfrds.com/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[7]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[8]).innerHTML.trim();
      torrent.size = _torrent.childNodes[5].innerHTML.trim().replace('<br>', ' ');
      torrent.time = moment(_torrent.childNodes[4].querySelector('span') ? _torrent.childNodes[4].querySelector('span').title : _torrent.childNodes[4].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      torrentList.push(torrent);
    }
    return {
      site: this.site,
      torrentList
    };
  };

  // SpringSunDay
  async _searchSpringsunday (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://springsunday.net/torrents.php?incldead=0&spstate=0&pick=0&inclbookmarked=0&exclusive=0&search=${encodeURIComponent(keyword)}&search_area=${keyword.match(/tt\d+/) ? 4 : 0}&search_mode=0`);
    const torrents = document.querySelectorAll('.torrents tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('td[class="embedded"] > a[href*="details"]').title.trim();
      torrent.subtitle = (_torrent.querySelector('.torrentname > tbody > tr .embedded a[href*=torrents]:last-of-type') || _torrent.querySelector('.torrentname > tbody > tr .embedded br')).nextSibling.nodeValue.trim();
      torrent.category = _torrent.querySelector('td a[href*=cat] img').title.trim();
      torrent.link = 'https://springsunday.net/' + _torrent.querySelector('a[href*=details]').href.trim();
      torrent.id = +torrent.link.match(/id=(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=seeders]') || _torrent.querySelector('a[href*=seeders] font') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      torrent.leechers = +(_torrent.querySelector('a[href*=leechers]') || _torrent.childNodes[15]).innerHTML.trim();
      torrent.snatches = +(_torrent.querySelector('a[href*=snatches] b') || _torrent.childNodes[17]).innerHTML.trim();
      torrent.size = _torrent.childNodes[11].innerHTML.trim().replace('<br>', ' ').replace(/([KMGPT])B/, '$1iB');
      torrent.time = moment(_torrent.childNodes[9].querySelector('span') ? _torrent.childNodes[9].querySelector('span').title : _torrent.childNodes[9].innerHTML.replace(/<br>/, ' ')).unix();
      torrent.size = util.calSize(...torrent.size.split(' '));
      torrent.tags = [];
      const tagsDom = _torrent.querySelectorAll('a[href*=torrents] span');
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

  // ToTheGlory
  async _searchTotheglory (keyword) {
    const torrentList = [];
    const document = await this._getDocument(`https://totheglory.im/browse.php?search_field=${encodeURIComponent(keyword)}&c=M`);
    const torrents = document.querySelectorAll('#torrent_table tbody tr:not(:first-child)');
    for (const _torrent of torrents) {
      const torrent = {};
      torrent.site = this.site;
      torrent.title = _torrent.querySelector('div[class="name_left"] a[href*="/t/"] b font').childNodes[0].nodeValue.trim();
      const subtitle = _torrent.querySelector('div[class="name_left"] a[href*="/t/"] b font span');
      torrent.subtitle = subtitle ? subtitle.innerHTML.trim() : '';
      torrent.category = _torrent.querySelector('td a[href*=cat] img').alt.trim();
      torrent.link = 'https://totheglory.im/' + _torrent.querySelector('a[href*="/t/"]').href.trim();
      torrent.downloadLink = 'https://totheglory.im/' + _torrent.querySelector('a[href*="/dl/"]').href;
      torrent.id = +torrent.link.match(/\/t\/(\d*)/)[1];
      torrent.seeders = +(_torrent.querySelector('a[href*=toseeders] a font') || _torrent.querySelector('a[href*=toseeders] font') || _torrent.querySelector('span[class=red]')).innerHTML.trim();
      const zeroLeechers = _torrent.innerHTML.match(/\/\n0/);
      if (zeroLeechers) {
        torrent.leechers = 0;
      } else {
        torrent.leechers = +_torrent.querySelector('a[href*=todlers]').innerHTML.trim();
      }
      torrent.snatches = +_torrent.innerHTML.match(/(\d+)<br>次/)[1];
      torrent.size = _torrent.innerHTML.match(/\d+\.*\d+<br>[PTGMK]B/)[0].replace('<br>', ' ');
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

  async search (keyword) {
    try {
      if (!this.searchWrapper[this.site]) {
        logger.error(this.site, '暂不支持搜索功能');
        return {
          site: this.site,
          torrentList: []
        };
      }
      const result = await this.searchWrapper[this.site].call(this, keyword);
      return result;
    } catch (e) {
      logger.error(this.site, '种子列表抓取失败 (疑似是 Cookie 失效, 或绕过 CloudFlare 5s 盾失效),', '报错如下:\n', e);
      return {
        site: this.site,
        torrentList: []
      };
    }
  };

  async pushTorrentById (id, downloadLink, client, savePath, category, autoTMM, recordType, recordNote) {
    recordNote = recordNote || `搜索推送, 站点: ${this.id}`;
    if (!downloadLink) {
      const downloadLinkTemplate = this.torrentDownloadLinkMap[this.site];
      if (!downloadLinkTemplate) throw new Error(`站点 ${this.site} 暂时不支持推送种子!`);
      downloadLink = downloadLinkTemplate.replace(/{ID}/, id);
    }
    const { filepath, hash, size, name } = await this._downloadTorrent(downloadLink);
    await global.runningClient[client].addTorrentByTorrentFile(filepath, hash, false, 0, 0, savePath, category, autoTMM);
    // 1: 添加 2: 拒绝 3: 错误 4: 搜索推送 5: 追剧推送 6: 豆瓣推送 99: 4-6 完成
    await util.runRecord('INSERT INTO torrents (hash, name, size, rss_id, link, record_time, add_time, record_type, record_note) values (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [hash, name, size, this.site, downloadLink, moment().unix(), moment().unix(), recordType, recordNote]);
    return '推送成功, 种子 hash: ' + hash;
  }

  async destroy () {
    logger.info('销毁站点实例', this.site);
    this.refreshJob.stop();
    delete global.runningSite[this.site];
  };
};

module.exports = Site;
