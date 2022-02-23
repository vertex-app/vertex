const logger = require('../libs/logger');
const util = require('../libs/util');
const CronJob = require('cron').CronJob;
const moment = require('moment');
const { JSDOM } = require('jsdom');

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
      GPW: this._gpw
    };
    this.cookie = site.cookie;
    this.site = site.name;
    this.cron = site.cron || '0 */4 * * *';
    this.refreshJob = new CronJob(this.cron, () => this.refreshInfo());
    this.refreshJob.start();
  };

  async _getDocument (url) {
    const html = (await util.requestPromise({
      url: url,
      headers: {
        cookie: this.cookie
      }
    })).body;
    const dom = new JSDOM(html);
    return dom.window.document;
  };

  // 白兔
  async _haresclub () {
    const info = {};
    const document = await this._getDocument('https://club.hares.top/');
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b,a[href^=userdetails] em').innerHTML;
    // 上传
    info.uploaded = document.querySelector('i[class="fa fa-arrow-up text-success fa-fw"]').nextElementSibling.innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('i[class="fa fa-arrow-down layui-font-orange fa-fw"]').nextElementSibling.innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelectorAll('font[class=color_downloaded]')[1].nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('span[class=color_uploaded]').nextSibling.nodeValue.trim();
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('span[class=color_downloaded]').nextSibling.nodeValue.trim();
    info.downloaded = util.calSize(...info.downloaded.split(' '));
    // 做种
    info.seeding = +document.querySelector('img[class=arrowup]').nextElementSibling.innerHTML.trim();
    // 下载
    info.leeching = +document.querySelector('img[class=arrowdown]').nextSibling.nodeValue.replace(')', '');
    return info;
  };

  // SpringSunDay
  async _springsunday () {
    const info = {};
    const document = await this._getDocument('https://springsunday.net/');
    // 用户名
    info.username = document.querySelector('a[href^=userdetails] b span').innerHTML;
    // 上传
    info.uploaded = document.querySelector('font[class=color_uploaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('font[class=color_downloaded]').nextSibling.nodeValue.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelectorAll('td[class="bottom nowrap"]')[6].innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelectorAll('td[class="bottom nowrap"]')[22].innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
    // 做种
    info.seeding = +document.querySelectorAll('td[class="bottom nowrap"]')[8].innerHTML.split('<')[0];
    // 下载
    info.leeching = +document.querySelectorAll('td[class="bottom nowrap"]')[24].innerHTML.split('<')[0];
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
    info.uploaded = baseInfo.match(/\d*\.\d* \wB/g)[0].replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = baseInfo.match(/\d*\.\d* \wB/g)[1].replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));
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
    info.uploaded = document.querySelector('a[href^="torrents.php?type=seeding&userid="]').nextElementSibling.innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('a[href^="torrents.php?type=leeching&userid="]').nextElementSibling.innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));

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
    info.uploaded = document.querySelector('a[href^="torrents.php?type=seeding&userid="] span').innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.uploaded = util.calSize(...info.uploaded.split(' '));
    // 下载
    info.downloaded = document.querySelector('a[href^="torrents.php?type=leeching&userid="] span').innerHTML.trim().replace(/(\w)B/, '$1iB');
    info.downloaded = util.calSize(...info.downloaded.split(' '));

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

  async refreshInfo () {
    try {
      const info = await this.refreshWrapper[this.site].call(this);
      info.updateTime = moment().unix();
      logger.debug(this.site, '站点数据成功抓取,', '数据如下:\n', info);
      this.info = info;
    } catch (e) {
      logger.error(this.site, '站点数据抓取失败 (疑似是 Cookie 失效, 或遇到 5s 盾),', '报错如下:\n', e);
    }
  };

  async destroy () {
    logger.info('销毁站点实例', this.site);
    this.refreshJob.stop();
    delete global.runningSite[this.site];
  };
};

module.exports = Site;
