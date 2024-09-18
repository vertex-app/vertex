const util = require('../libs/util');
const moment = require('moment');
const logger = require('../libs/logger');
const cron = require('node-cron');
const redis = require('../libs/redis');
const { JSDOM } = require('jsdom');
const Push = require('./Push');
const path = require('path');
const fs = require('fs');

class Douban {
  constructor (douban) {
    this.id = douban.id;
    this.alias = douban.alias;
    this.cookie = douban.cookie;
    this.raceRules = douban.raceRules;
    this.rejectRules = douban.rejectRules;
    this.categories = {};
    this.failedList = {};
    for (const category of douban.categories) {
      this.categories[category.doubanTag] = { ...category };
    }
    this.linkRule = douban.linkRule;
    this.sites = douban.sites;
    this.client = douban.client;
    this.cron = douban.cron;
    this.users = (douban.users || '').split(',').filter(item => item.trim());
    this.advancedMode = douban.advancedMode;
    this.defaultRefreshCron = '30 1 * * *';
    this.enableWechatLink = douban.enableWechatLink;
    this.notify = douban.notify;
    this._notify = util.listPush().filter(i => i.id === this.notify)[0] || {};
    this.push = douban.push;
    this._notify.push = this.push;
    this.refreshWishJobs = {};
    this.refreshStat = {};
    this.searchRemoteTorrentJobs = {};
    this.ntf = new Push(this._notify);
    this.refreshWishJob = cron.schedule(douban.cron, () => this.refreshWishList());
    this.checkFinishJob = cron.schedule(global.checkFinishCron, () => this.checkFinish());
    this.clearSelectFailedJob = cron.schedule('0 0 * * *', () => this.clearSelectFailed());
    this.selectTorrentToday = {};
    this.wishes = (util.listDoubanSet().filter(item => item.id === this.id)[0] || {}).wishes || [];
    for (const wish of this.wishes) {
      if (!wish.downloaded && !this.refreshWishJobs[wish.id]) {
        this.refreshWishJobs[wish.id] = cron.schedule(this.defaultRefreshCron, () => this._refreshWish(wish.id));
        if (this.advancedMode && !this.searchRemoteTorrentJobs[wish.id]) {
          this.searchRemoteTorrentJobs[wish.id] = cron.schedule('*/2 * * * *', () => this._refreshWish(wish.id, true));
        }
      }
    };
    logger.binge('豆瓣账号', this.alias, '初始化完毕');
  };

  async _getDocument (url, expire = 300) {
    const cache = await redis.get(`vertex:document:body:${url + util.md5(this.cookie)}`);
    if (!cache) {
      const html = (await util.requestPromise({
        url: url,
        headers: {
          cookie: this.cookie
        }
      })).body;
      await redis.setWithExpire(`vertex:document:body:${url + util.md5(this.cookie)}`, html, expire);
      const dom = new JSDOM(html);
      return dom.window.document;
    } else {
      const dom = new JSDOM(cache);
      return dom.window.document;
    }
  };

  async _searchRemoteTorrents (keyword) {
    const ids = this.sites.map(i => global.runningSite[i].siteId).filter(item => item);
    const result = (await util.requestPromise({
      url: `https://dash.vertex-app.top/api/torrent/search?keyword=${encodeURIComponent(keyword)}&apiKey=${global.panelKey}&site=${JSON.stringify(ids)}`
    })).body;
    return result;
  };

  async _getJson (url) {
    const cache = await redis.get(`vertex:douban:json:${url}`);
    if (!cache) {
      const body = (await util.requestPromise({
        url: url,
        headers: {
          cookie: this.cookie
        }
      })).body;
      await redis.setWithExpire(`vertex:douban:json:${url}`, body, 30);
      return JSON.parse(body);
    } else {
      return JSON.parse(cache);
    }
  };

  async _post (url, form) {
    const cache = await redis.get(`vertex:douban:post:${url}`);
    if (!cache) {
      const body = (await util.requestPromise({
        url: url,
        method: 'post',
        headers: {
          cookie: this.cookie
        },
        form
      })).body;
      await redis.setWithExpire(`vertex:douban:post:${url}`, body, 30);
      return body;
    } else {
      return cache;
    }
  };

  async _getDoubanInfo (url) {
    const dom = await this._getDocument(url);
    const info = {};
    // poster
    info.poster = (dom.querySelector('img[title="点击看更多海报"]') || dom.querySelector('img[title="点击看大图"]') || dom.querySelector('img[title="点击上传封面图片"]')).getAttribute('src').replace(/img\d/, 'img9').replace('s_ratio', 'l_ratio').replace('webp', 'jpg');

    // span info
    const spans = dom.querySelectorAll('#info > span');
    for (const span of spans) {
      switch (span.innerHTML) {
      case '又名:':
        info.aka = span.nextSibling.nodeValue.trim();
        break;
      case '制片国家/地区:':
        info.area = span.nextSibling.nodeValue.trim();
        break;
      case '语言:':
        info.language = span.nextSibling.nodeValue.trim();
        break;
      case '单集片长:':
        info.length = span.nextSibling.nodeValue.trim();
        break;
      }
    }

    // year
    info.year = dom.querySelector('.year').innerHTML.match(/(\d+)/);

    // imdb
    info.imdb = dom.querySelector('#info').innerHTML.match(/(tt\d+)/);

    // desc
    info.desc = dom.querySelector('span[property="v:summary"]')?.innerHTML.replace(/\n +/g, '').replace('<br>', '\n') || '无';

    // category
    info.category = [...dom.querySelectorAll('span[property="v:genre"]')].map(item => item.innerHTML).join(' / ');

    // tag
    // info.tag = dom.querySelector('span.color_gray')?.innerHTML;

    info.releaseAt = dom.querySelector('span[property="v:initialReleaseDate"]')?.innerHTML.match(/\d{4}-\d{2}-\d{2}/) || '';
    if (info.releaseAt) {
      info.releaseAt = info.releaseAt[0];
    }

    try {
      // rating
      info.rating = {
        result: dom.querySelector('strong[class="ll rating_num"]').innerHTML,
        votes: dom.querySelector('a[class="rating_people"] > span').innerHTML
      };
    } catch (e) {
      info.rating = {
        result: '暂无',
        votes: '暂无'
      };
    }

    // length
    info.length = info.length || (dom.querySelector('span[property="v:runtime"]') || {}).innerHTML || '暂无';

    // episodes
    info.episodes = dom.querySelectorAll('a[href*="episode"]');

    info.mainCreator = [...dom.querySelectorAll('a[rel="v:directedBy"],a[rel="v:starring"]')].slice(0, 5).map(item => item.innerHTML).join(' / ');
    return info;
  };

  reloadPush () {
    logger.binge('豆瓣账号', this.alias, '重新载入推送方式');
    this._notify = util.listPush().filter(item => item.id === this.notify)[0] || {};
    this._notify.push = true;
    this.ntf = new Push(this._notify);
  }

  destroy () {
    logger.binge('销毁豆瓣实例', this.alias);
    for (const key of Object.keys(this.refreshWishJobs)) {
      if (this.refreshWishJobs[key]) {
        this.refreshWishJobs[key].stop();
        delete this.refreshWishJobs[key];
      }
    }
    for (const key of Object.keys(this.searchRemoteTorrentJobs)) {
      if (this.searchRemoteTorrentJobs[key]) {
        this.searchRemoteTorrentJobs[key].stop();
        delete this.searchRemoteTorrentJobs[key];
      }
    }
    delete this.refreshWishJobs;
    delete this.searchRemoteTorrentJobs;
    this.refreshWishJob.stop();
    delete this.refreshWishJob;
    this.checkFinishJob.stop();
    delete this.checkFinishJob;
    this.clearSelectFailedJob.stop();
    delete this.clearSelectFailedJob;
    delete global.runningDouban[this.id];
  };

  async deleteWish (id) {
    const wishLength = this.wishes.length;
    this.wishes = this.wishes.filter(item => item.id !== id);
    if (this.refreshWishJobs[id]) {
      this.refreshWishJobs[id].stop();
      delete this.refreshWishJobs[id];
    }
    if (this.searchRemoteTorrentJobs[id]) {
      this.searchRemoteTorrentJobs[id].stop();
      delete this.searchRemoteTorrentJobs[id];
    }
    this._saveSet();
    await this.delWish(id);
    return this.wishes.length !== wishLength;
  }

  updateWish (wish) {
    if (!wish.id) {
      let newWish = {
        name: '影视剧名',
        link: 'https://wiki.vertex-app.top',
        poster: 'https://pic.lswl.in/images/2022/07/10/5ae104f82f39eb4059861393ef24d440.png',
        id: util.uuid.v4(),
        rating: {
          result: '0',
          votes: '0'
        },
        area: '',
        language: '',
        category: '',
        desc: '',
        mainCreator: '',
        releaseAt: '',
        searchKey: ''
      };
      newWish = Object.assign(newWish, wish);
      if (!newWish.episodes) {
        delete newWish.episodes;
      }
      this.wishes.push(newWish);
      this._saveSet();
      return true;
    }
    for (const [index, value] of this.wishes.entries()) {
      if (wish.id === value.id) {
        if (this.refreshWishJobs[wish.id]) {
          this.refreshWishJobs[wish.id].stop();
          delete this.refreshWishJobs[wish.id];
        }
        if (this.searchRemoteTorrentJobs[wish.id]) {
          this.searchRemoteTorrentJobs[wish.id].stop();
          delete this.searchRemoteTorrentJobs[wish.id];
        }
        if (!wish.downloaded) {
          this.refreshWishJobs[wish.id] = cron.schedule(this.defaultRefreshCron, () => this._refreshWish(wish.id));
          if (this.advancedMode) {
            this.searchRemoteTorrentJobs[wish.id] = cron.schedule('*/2 * * * *', () => this._refreshWish(wish.id, true));
          }
        }
        if (wish.episodeNow) {
          wish.episodeNow = +wish.episodeNow;
        }
        if (wish.episodes) {
          wish.episodes = +wish.episodes;
        }
        this.wishes[index] = { ...wish };
        this._saveSet();
        return true;
      }
    }
  }

  _refreshWish (id, remote = false) {
    const randomDelayTime = parseInt(Math.random() * (remote ? 120 : 3600 * 4));
    logger.debug('延时开启搜索资源任务, 延时时间', randomDelayTime, '秒');
    setTimeout(async () => {
      try {
        await this.refreshWish(id, false, remote);
      } catch (e) {
        logger.error('搜索任务报错:\n', e);
        delete this.refreshStat[id];
      }
    }, randomDelayTime * 1000);
  }

  async refreshWish (id, manual = false, remote) {
    const logbinge = (...args) => {
      remote ? logger.advanced(...args) : logger.binge(...args);
    };
    const wish = this.wishes.filter(item => item.id === id)[0];
    if (!manual && wish.releaseAt && moment(wish.releaseAt).unix() > moment().unix()) {
      logger.binge('豆瓣账号', this.alias, '/', wish.name, '还未上映', wish.releaseAt, '退出任务');
      return;
    }
    if (wish.downloaded || (+wish.episodes === +wish.episodeNow)) {
      this.ntf.startRefreshWish(`${this.alias} / ${wish.name} 已完成, 退出任务`);
      if (this.refreshWishJobs[id]) {
        this.refreshWishJobs[id].stop();
        delete this.refreshWishJobs[id];
      }
      if (this.searchRemoteTorrentJobs[id]) {
        this.searchRemoteTorrentJobs[id].stop();
        delete this.searchRemoteTorrentJobs[id];
      }
      wish.downloaded = wish.downloaded || (+wish.episodeNow === +wish.episodes);
      this._saveSet();
      return;
    }
    if (!remote && !manual && await redis.get(`vertex:douban:refresh_cache:${id}`)) {
      logger.binge('豆瓣账号', this.alias, '/', wish.name, '近 23 小时有自动搜索记录, 退出任务');
      this.ntf.startRefreshWish(`${this.alias} / ${wish.name} 近 23 小时有自动搜索记录, 退出任务`);
      return;
    }
    if (this.refreshStat[id]) {
      logbinge('豆瓣账号', this.alias, '/', wish.name, '任务仍在执行中, 退出任务');
      return;
    }
    this.refreshStat[id] = 1;
    if (!remote) this.ntf.startRefreshWish(`${this.alias} / ${wish.name}`);
    wish.downloaded = await this.selectTorrent(wish, false, remote);
    if (!remote && !wish.downloaded) {
      wish.downloaded = await this.selectTorrent(wish, true);
      await redis.setWithExpire(`vertex:douban:refresh_cache:${id}`, '1', 2400 * 23);
    }
    if (!wish.downloaded) {
      logbinge(this.alias, '未匹配种子', wish.name);
      if (!this.selectTorrentToday[wish.id] && !remote) {
        this.ntf.selectTorrentError(this.alias, wish);
        this.selectTorrentToday[wish.id] = 1;
      }
    }
    wish.downloaded = wish.downloaded && (+wish.episodeNow === +wish.episodes || !wish.episodes);
    this._saveSet();
    delete this.refreshStat[id];
  }

  async refreshWishList (manual = false) {
    const document = await this._getDocument('https://movie.douban.com/mine?status=wish', 20);
    const items = document.querySelectorAll('.article .grid-view .item');
    if (!items.length) {
      logger.error('豆瓣账户', this.alias, '刷新想看列表失败', '疑似是豆瓣 Cookie 过期', '任务退出');
      await this.ntf.startRefreshWishError(['豆瓣账户', this.alias, '刷新想看列表失败', '疑似是豆瓣 Cookie 过期', '任务退出'].join(' '));
      return;
    }
    const wishes = [];
    for (const item of items) {
      const wish = {};
      wish.name = item.querySelector('li[class=title] em').innerHTML;
      wish.link = item.querySelector('li[class=title] a').href;
      wish.poster = item.querySelector('a[class=nbg] img').src.trim().replace(/img\d/, 'img9').replace('s_ratio', 'l_ratio').replace('webp', 'jpg');
      wish.id = wish.link.match(/\/(\d+)\//)[1];
      wish.tag = (item.querySelector('span.tags')?.innerHTML)?.replace('标签: ', '') || item.querySelector('span[class=\'comment\']')?.innerHTML;
      let doubanInfo;
      if (this.wishes.filter(item => item.id === wish.id).length !== 0) {
        continue;
      }
      try {
        doubanInfo = await this._getDoubanInfo(wish.link);
      } catch (e) {
        logger.error('豆瓣账户', this.alias, '查询影视', wish.name, '详情失败', '疑似是豆瓣 Cookie 过期', '任务退出\n', e);
        await this.ntf.selectTorrentError(this.alias, wish, ['豆瓣账户', this.alias, '查询影视', wish.name, '详情失败', '疑似是豆瓣 Cookie 过期', '任务退出'].join(' '));
        return;
      }
      const imdb = doubanInfo.imdb;
      const year = doubanInfo.year;
      wish.imdb = imdb ? imdb[1] : null;
      wish.year = year ? year[1] : null;
      wish.rating = doubanInfo.rating;
      wish.length = doubanInfo.length;
      wish.area = doubanInfo.area;
      wish.language = doubanInfo.language;
      wish.category = doubanInfo.category;
      wish.desc = doubanInfo.desc;
      wish.mainCreator = doubanInfo.mainCreator;
      wish.episodes = doubanInfo.episodes;
      wish.releaseAt = doubanInfo.releaseAt;
      wish.searchKey = '';
      wishes.push(wish);
    }

    for (const user of this.users) {
      const document = await this._getDocument(`https://movie.douban.com/people/${user}/wish`, 20);
      const items = document.querySelectorAll('.article .grid-view .item');
      if (!items.length) {
        logger.error('豆瓣账户', this.alias, '刷新想看列表失败', '疑似是豆瓣 Cookie 过期', '任务退出');
        await this.ntf.startRefreshWishError(['豆瓣账户', this.alias, '刷新想看列表失败', '疑似是豆瓣 Cookie 过期', '任务退出'].join(' '));
        return;
      }
      for (const item of items) {
        const wish = {};
        wish.name = item.querySelector('li[class=title] em').innerHTML;
        wish.link = item.querySelector('li[class=title] a').href;
        wish.poster = item.querySelector('a[class=nbg] img').src.trim().replace(/img\d/, 'img9').replace('s_ratio', 'l_ratio').replace('webp', 'jpg');
        wish.id = wish.link.match(/\/(\d+)\//)[1];
        wish.tag = (item.querySelector('span.tags')?.innerHTML)?.replace('标签: ', '') || item.querySelector('span[class=\'comment\']')?.innerHTML;
        let doubanInfo;
        if (this.wishes.filter(item => item.id === wish.id).length !== 0) {
          continue;
        }
        try {
          doubanInfo = await this._getDoubanInfo(wish.link);
        } catch (e) {
          logger.error('豆瓣账户', this.alias, '/', user, '查询影视', wish.name, '详情失败', '疑似是豆瓣 Cookie 过期', '任务退出\n', e);
          await this.ntf.selectTorrentError(this.alias, wish, ['豆瓣账户', this.alias, '/', user, '查询影视', wish.name, '详情失败', '疑似是豆瓣 Cookie 过期', '任务退出'].join(' '));
        }
        const imdb = doubanInfo.imdb;
        const year = doubanInfo.year;
        wish.imdb = imdb ? imdb[1] : null;
        wish.year = year ? year[1] : null;
        wish.rating = doubanInfo.rating;
        wish.length = doubanInfo.length;
        wish.area = doubanInfo.area;
        wish.language = doubanInfo.language;
        wish.category = doubanInfo.category;
        wish.desc = doubanInfo.desc;
        wish.mainCreator = doubanInfo.mainCreator;
        wish.episodes = doubanInfo.episodes;
        wish.releaseAt = doubanInfo.releaseAt;
        wish.searchKey = '';
        wishes.push(wish);
      }
    }
    const _doubanSet = util.listDoubanSet().filter(item => item.id === this.id)[0];
    if (!_doubanSet) {
      this.wishes = wishes.map(item => {
        logger.binge('豆瓣账户', this.alias, '首次添加想看列表', item.name, '已设为已下载, 跳过');
        const newItem = { ...item, downloaded: true };
        delete newItem.episodes;
        return newItem;
      });
      this._saveSet();
      await this.ntf.addDouban(this.alias, wishes);
    } else {
      for (const wish of wishes) {
        if (!this.wishes.filter(item => item.id === wish.id)[0]) {
          logger.binge('豆瓣账户', this.alias, wish.name, '已添加入想看列表');
          if (!wish.tag) {
            logger.binge('豆瓣账户', this.alias, wish.name, '未识别到标签, 跳过');
            continue;
          }
          const fitTag = Object.keys(this.categories).filter(item => wish.tag.indexOf(item) !== -1);
          if (!fitTag[0]) {
            logger.binge('豆瓣账户', this.alias, wish.name, '标签分类', wish.tag, '未检索到标签, 跳过');
            continue;
          }
          wish.tag = fitTag[0];
          if (this.categories[wish.tag].defaultrestrictYear) {
            wish.restrictYear = true;
          }
          const episodes = wish.episodes;
          if (episodes.length !== 0) {
            wish.episodes = +episodes[episodes.length - 1].href.match(/episode\/(\d+)/)[1];
            wish.episodeNow = 0;
          } else {
            delete wish.episodes;
            if (this.categories[wish.tag].defaultEpisodes) {
              wish.episodes = +this.categories[wish.tag].defaultEpisodes;
              wish.episodeNow = 0;
            }
          }
          try {
            this.wishes.push(wish);
            this.ntf.addDoubanWish(this.alias, wish);
            if (this.categories[wish.tag].autoSearch !== false) {
              this.updateWish(wish);
              (async () => {
                try {
                  await this.refreshWish(wish.id);
                } catch (e) {
                  logger.error(e);
                }
              })();
            } else {
              logger.binge('豆瓣账户:', this.alias, '项目', wish.name, '首次添加不刷新', '跳过');
            }
          } catch (e) {
            logger.error('豆瓣账户:', this.alias, '选种报错', wish.name, ':\n', e);
          }
          this._saveSet();
        }
      };
    }
  }

  _saveSet () {
    const set = {
      id: this.id,
      wishes: this.wishes
    };
    fs.writeFileSync(path.join(__dirname, '../data/douban/set', this.id + '.json'), JSON.stringify(set, null, 2));
  };

  _fitConditions (_torrent, conditions, wish) {
    let fit = true;
    const torrent = { ..._torrent };
    torrent.time = moment().unix() - torrent.time;
    torrent.area = wish.area || '';
    torrent.language = wish.language || '';
    torrent.tags = torrent.tags.join(',');
    torrent.subtitle = torrent.subtitle + torrent.tags;
    for (const condition of conditions) {
      let value;
      switch (condition.compareType) {
      case 'equals':
        fit = fit && (torrent[condition.key] === condition.value || torrent[condition.key] === +condition.value);
        break;
      case 'bigger':
        value = 1;
        condition.value.split('*').forEach(item => {
          value *= +item;
        });
        fit = fit && torrent[condition.key] > value;
        break;
      case 'smaller':
        value = 1;
        condition.value.split('*').forEach(item => {
          value *= +item;
        });
        fit = fit && torrent[condition.key] < value;
        break;
      case 'contain':
        fit = fit && condition.value.split(',').filter(item => torrent[condition.key].indexOf(item) !== -1).length !== 0;
        break;
      case 'includeIn':
        fit = fit && condition.value.split(',').indexOf(torrent[condition.key]) !== -1;
        break;
      case 'notContain':
        fit = fit && condition.value.split(',').filter(item => torrent[condition.key].indexOf(item) !== -1).length === 0;
        break;
      case 'notIncludeIn':
        fit = fit && condition.value.split(',').indexOf(torrent[condition.key]) === -1;
        break;
      case 'regExp':
        fit = fit && (torrent[condition.key] + '').match(new RegExp(condition.value));
        break;
      case 'notRegExp':
        fit = fit && !(torrent[condition.key] + '').match(new RegExp(condition.value));
        break;
      }
    }
    return fit;
  }

  _fitRaceRule (_rule, torrent, wish) {
    const rule = { ..._rule };
    let fit;
    if (rule.type === 'javascript') {
      try {
        // eslint-disable-next-line no-eval
        fit = (eval(rule.code))(torrent);
      } catch (e) {
        logger.error('下载器', this.alias, '选种规则', rule.alias, '存在语法错误\n', e);
        return false;
      }
    } else {
      try {
        fit = rule.conditions.length !== 0 && this._fitConditions(torrent, rule.conditions, wish);
      } catch (e) {
        logger.error('下载器', this.alias, '选种规则', rule.alias, '遇到错误\n', e);
        return false;
      }
    }
    return fit;
  };

  _setEpisodeNow (id, episodeNow) {
    for (const wish of this.wishes) {
      if (wish.id === id) {
        wish.episodeNow = Math.max(wish.episodeNow, episodeNow);
        logger.binge(wish.name, '更新至', episodeNow);
        this._saveSet();
      }
    }
  }

  async _linkTorrentFiles (torrent, client, recordNoteJson) {
    // 链接有失败标志
    let isError = false;
    if (!global.linkMapping[torrent.hash]) {
      global.linkMapping[torrent.hash] = [];
    }
    const wish = recordNoteJson.wish;
    const _wish = this.wishes.filter(item => item.id === wish.id)[0];
    wish.episodeOffset = _wish?.episodeOffset || 0;
    wish.fixedSeason = (_wish.fixedSeason + '' === +_wish.fixedSeason + '') ? +_wish.fixedSeason : undefined;
    if (_wish && _wish.cancelLink) {
      logger.binge(this.alias, '本项目已设置取消链接操作, 跳过链接操作');
      return;
    }
    if (!this.linkRule) {
      logger.binge(this.alias, '本实例不含链接规则, 跳过链接操作');
      return;
    }
    const linkRule = util.listLinkRule().filter(item => item.id === this.linkRule)[0];
    let size = 1;
    linkRule.minFileSize.split('*').forEach(i => { size *= +i; });
    linkRule.minFileSize = size;
    const files = await global.runningClient[client].getFiles(torrent.hash);
    const _torrent = recordNoteJson.torrent;
    const category = recordNoteJson.category;
    if (category.type === 'series') {
      // let newEpisode = 0;
      for (const file of files) {
        const filename = path.basename(file.name);
        if (file.size < linkRule.minFileSize) continue;
        if (linkRule.excludeKeys && linkRule.excludeKeys.split(',').some(item => filename.indexOf(item) !== -1)) continue;
        const seriesName = wish.name.split('/')[0].trim().replace(/ +/g, '.').replace(/\.?[第].*[季部]/, '').replace(/\..*篇[\d一二三四五六七八九十]*/, '');
        let season = (filename.match(/[. ]S(\d+)/) || [0, null])[1];
        let episode = util.scrapeEpisodeByFilename(filename, wish.removeKeyword);
        if (!episode) {
          continue;
        }
        let fakeEpisode = 0;
        const part = (filename.match(/[ .]?[Pp][Aa][Rr][Tt][ .]?0?([abAB12])/));
        if (part?.[1]) {
          fakeEpisode = part?.[1] === 'A' || part?.[1] === '1' ? episode * 2 - 1 : episode * 2;
        }
        if (season === null) {
          const seasonSubtitle = _torrent.subtitle.replace(/ /g, '').match(/第([一二三四五六七八九十])[季部]/);
          if (seasonSubtitle) {
            season = {
              一: 1,
              二: 2,
              三: 3,
              四: 4,
              五: 5,
              六: 6,
              七: 7,
              八: 8,
              九: 9,
              十: 10
            }[seasonSubtitle[1]];
          }
        }
        if (season === null) {
          const seasonSubtitle = _torrent.subtitle.replace(/ /g, '').match(/第(\d+)[季部]/);
          if (seasonSubtitle) {
            season = +seasonSubtitle[1];
          }
        }
        const _season = wish.fixedSeason;
        if (_season === undefined) {
          season = season || 1;
        } else {
          season = _season;
        }
        // newEpisode = Math.max(episode, newEpisode);
        episode = (fakeEpisode || episode) + +wish.episodeOffset;
        episode = 'E' + '0'.repeat(Math.max(2 - ('' + episode).length, 0)) + (episode);
        season = 'S' + '0'.repeat(2 - ('' + season).length) + season;
        const prefix = linkRule.keepSeriesName ? seriesName + '.' : '';
        const suffixKeys = [];
        const reservedKeys = (linkRule.reservedKeys || '').split(',');
        for (const key of reservedKeys) {
          if (filename.indexOf(key) !== -1) {
            suffixKeys.push(key);
          }
        }
        const suffix = suffixKeys[0] ? '.' + suffixKeys.filter(key => !suffixKeys.some(item => item.indexOf(key) !== -1 && item !== key)).join('.') : '';
        let group = '';
        if (linkRule.group) {
          group = (filename.match(/[-￡][^-￡]*?$/) || [''])[0].replace(/[-￡]/, '-');
        }
        const fileExt = path.extname(file.name);
        file.name = file.name.replace(/\\/g, '/');
        group = group.replace(fileExt, '');
        const linkFilePath = path.join(linkRule.linkFilePath, category.libraryPath, seriesName, season).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, (prefix + season + episode + suffix + group + fileExt).replace(/'/g, '\\\''));
        const targetFile = path.join(torrent.savePath.replace(linkRule.targetPath.split('##')[0], linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const linkMode = linkRule.hardlink ? 'f' : 'sf';
        const command = `${linkRule.umask ? 'umask ' + linkRule.umask + ' && ' : ''}mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
        logger.binge(this.alias, '执行链接命令', command);
        try {
          if (linkRule.local) {
            await util.exec(command, { shell: '/bin/bash' });
          } else {
            await global.runningServer[linkRule.server].run(command);
          }
          global.linkMapping[torrent.hash].push((linkRule.server || '$local$') + '####' + linkFile);
        } catch (e) {
          logger.error(e);
          isError = true;
        }
      }
      /*
      if (newEpisode) {
        this._setEpisodeNow(wish.id, newEpisode);
      }
      */
    } else if (category.type === 'movie') {
      for (const file of files) {
        if (file.size < linkRule.minFileSize) continue;
        if (linkRule.excludeKeys && linkRule.excludeKeys.split(',').some(item => file.name.indexOf(item) !== -1)) continue;
        const movieName = wish.name.split('/')[0].trim();
        const filename = file.name;
        let year = (filename.match(/[. ](20\d\d)[. ]/) || filename.match(/[. ](19\d\d)[. ]/) || ['', ''])[1];
        if (year) {
          year = '.' + year;
        }
        const suffixKeys = [];
        const reservedKeys = (linkRule.reservedKeys || '').split(',');
        for (const key of reservedKeys) {
          if (filename.indexOf(key) !== -1) {
            suffixKeys.push(key);
          }
        }
        const suffix = suffixKeys[0] ? '.' + suffixKeys.filter(key => !suffixKeys.some(item => item.indexOf(key) !== -1 && item !== key)).join('.') : '';
        let group = '';
        if (linkRule.group) {
          group = (filename.match(/[-￡][^-￡]*?$/) || [''])[0].replace(/[-￡]/, '-');
        }
        const fileExt = path.extname(filename);
        file.name = file.name.replace(/\\/g, '/');
        group = group.replace(fileExt, '');
        const linkFilePath = path.join(linkRule.linkFilePath, category.libraryPath, `${movieName}${year}`).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, `${movieName}${year}${suffix + group}${fileExt}`.replace(/'/g, '\\\''));
        const targetFile = path.join(torrent.savePath.replace(linkRule.targetPath.split('##')[0], linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const linkMode = linkRule.hardlink ? 'f' : 'sf';
        const command = `${linkRule.umask ? 'umask ' + linkRule.umask + ' && ' : ''}mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
        logger.binge(this.alias, '执行链接命令', command);
        try {
          if (linkRule.local) {
            await util.exec(command, { shell: '/bin/bash' });
          } else {
            await global.runningServer[linkRule.server].run(command);
          }
          global.linkMapping[torrent.hash].push((linkRule.server || '$local$') + '####' + linkFile);
        } catch (e) {
          logger.error(e);
          isError = true;
        }
      }
    }
    try {
      await global.runningClient[client].addTorrentTag(torrent.hash, (isError ? '链接遇到错误-' : '已链接-') + wish.name.split('/')[0].replace(/ /g, '-'));
    } catch (e) {
      logger.error('添加种子标签失败', e);
    }
    util.saveLinkMapping();
  }

  scrapeEpisode (_subtitle = '') {
    const subtitle = _subtitle.replace(/ /g, '').replace(/[Hh][Dd][Rr]10/g, '').replace(/\d{4}-\d{1,2}-\d{1,2}/g, '');
    const episodeMap = {
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
      十: 10
    };
    const episodeTypeA = (subtitle.match(/[第E]\d{1,4}-E?\d{1,4}[集期]?/g) || []).map(item => item.replace(/[E第集期]/g, '').split('-'))[0] || [];
    const episodeTypeB = (subtitle.match(/[第全E]\d{2,4}[^\d帧部季Ff]/g) || []).map(item => item.match(/\d{2,4}/g)).flat() || [];
    const episodeTypeC = (subtitle.match(/[第全E]\d[^\d帧部季Kk]/g) || []).map(item => item.match(/\d/g)).flat() || [];
    const episodeTypeD = ((subtitle.match(/全[一二三四五六七八九十]集/g) || []).map(item => item.match(/[一二三四五六七八九十]/g)).flat() || []).map(item => episodeMap[item]);
    const episodeTypeE = ((subtitle.match(/[^\d][第全][一二三四五六七八九十][集期话]/g) || []).map(item => item.match(/[一二三四五六七八九十]/g)).flat() || []).map(item => episodeMap[item]);
    let episodes = episodeTypeA.concat(episodeTypeB).concat(episodeTypeC).concat(episodeTypeD).concat(episodeTypeE);
    if (subtitle.match(/[集期] *[上]/) && !subtitle.match(/[集期] *上[中 +]*下/)) {
      episodes = episodes.map(item => item - 0.5);
    }
    if (subtitle.match(/[集期] *[中]/)) {
      episodes = episodes.map(item => item - 0.25);
    }
    return episodes;
  };

  async selectTorrent (_wish, imdb = false, remote = false) {
    const logdebug = (...args) => {
      remote ? logger.advanceddebug(...args) : logger.bingedebug(...args);
    };
    const logbinge = (...args) => {
      remote ? logger.advanced(...args) : logger.binge(...args);
    };
    const wish = { ..._wish };
    if (!this.categories[wish.tag]) {
      throw new Error(`**** 追剧任务: ${wish.name} 所在的标签: ${wish.tag} 已不存在, 请注意同步修改该任务标签`);
    }
    wish.doubanId = this.id;
    const searchKey = (wish.searchKey || wish.name.split('/')[0]).replace(/[!\uff01\uff1a.。:?？，,·・]/g, ' ').replace(/([^\d]?)([\d一二三四五六七八九十]+)([^\d])/g, '$1 $2 $3').replace(/([^\d])([\d一二三四五六七八九十]+)([^\d]?)/g, '$1 $2 $3').replace(/ +/g, ' ').trim();
    if (!wish.imdb && imdb) {
      logbinge(this.alias, '无 IMDB 编号, 跳过搜索种子');
      return false;
    }
    let torrents = [];
    if (remote) {
      logbinge(this.alias, '启动搜索任务, 搜索类型: 远程搜索', '影视:', wish.name, '关键词:', searchKey, '豆瓣ID', wish.id, 'imdb', wish.imdb);
      const result = JSON.parse(await this._searchRemoteTorrents(searchKey));
      if (result.success) {
        torrents = result.data.map(item => {
          return {
            site: item.site,
            sitePriority: global.runningSite[item.site]?.priority || 0,
            title: item.title,
            subtitle: item.subtitle,
            category: item.category,
            link: item.link,
            id: item.id,
            seeders: 999,
            leechers: 999,
            snatches: 999,
            size: item.size,
            time: item.time,
            tags: (item.tags || '').split(',')
          };
        });
      } else {
        logger.error('远程请求种子失败:', result.message);
        torrents = [];
      }
    } else {
      logbinge(this.alias, '启动搜索任务, 搜索类型:', imdb ? 'imdb' : '名称', wish.name, '影视:', wish.name, '豆瓣ID', wish.id, 'imdb', wish.imdb, '开始搜索以下站点', this.sites.join(', '));
      const result = await Promise.all(this.sites.map(i => global.runningSite[i].search(imdb ? wish.imdb : searchKey)));
      torrents = result.map(i => i.torrentList).flat();
    }
    logbinge(this.alias, '种子搜索已完成, 共计查找到', torrents.length, '个种子');
    const raceRuleList = util.listRaceRule();
    const rejectRules = [...new Set(this.rejectRules.concat(this.categories[wish.tag].rejectRules || []))]
      .map(i => raceRuleList.filter(ii => ii.id === i)[0])
      .filter(i => i);
    const raceRules = [...new Set(this.raceRules.concat(this.categories[wish.tag].raceRules || []))]
      .map(i => raceRuleList.filter(ii => ii.id === i)[0])
      .filter(i => i)
      .sort((a, b) => +b.priority - +a.priority);
    const raceRuleArrs = {};
    for (const raceRule of raceRules) {
      if (!raceRuleArrs[raceRule.priority]) {
        raceRuleArrs[raceRule.priority] = [raceRule];
      } else {
        raceRuleArrs[raceRule.priority].push(raceRule);
      }
    }
    torrents = torrents.filter(item => {
      let subtitle = item.subtitle;
      const name = (wish.searchKey || wish.name.split('/')[0]).replace(/[!\uff01\uff1a.。:?？，,·・]/g, ' ').trim();
      const serachKeys = name.split(/[^0-9a-zA-Z\u4e00-\u9fa5*]|丨/g).filter(item => item);
      if (!subtitle) return false;
      subtitle = subtitle.replace(/(第[\d一二三四五六七八九十]+季)/g, ' $1 ');
      subtitle = subtitle.replace(/([第全][\d一二三四五六七八九十]+[集话期])/, ' $1 ');
      const keys = subtitle.split(/[^0-9a-zA-Z\u4e00-\u9fa5*]|丨/g).filter(item => item);
      const result = serachKeys.every(i => keys.indexOf(i) !== -1) || keys.indexOf(name.replace(' ', '')) !== -1;
      if (!result) logdebug(this.alias, '想看', JSON.stringify(serachKeys), '种子', item.subtitle, '提取分词', JSON.stringify(keys), '未匹配 提前拒绝');
      return result;
    });
    let episodeList = [];
    let maxEpisode = 0;
    if (wish.episodes) {
      episodeList = Array.from(new Set(torrents.map(item => {
        let _subtitle = item.subtitle;
        if (wish.removeKeyword) {
          wish.removeKeyword.split(',').forEach((item) => { _subtitle = _subtitle.replace(new RegExp(item, 'gi'), ''); });
        }
        let episodes = [];
        if (item.site === 'MikanProject') {
          episodes = [util.scrapeEpisodeByFilename(_subtitle)];
        } else {
          episodes = this.scrapeEpisode(_subtitle);
        }
        return episodes;
      }).flat()));
      maxEpisode = Math.max(...episodeList);
    }
    let matched = false;
    let _matched = false;
    let matchFailed = false;
    logbinge(this.alias, '选种规则总计:', raceRules.length, ' 开始按照优先级查找');
    while (!matchFailed || wish.episodeNow < maxEpisode) {
      if (wish.episodes && +wish.episodeNow >= +wish.episodes) {
        logbinge(this.alias, wish.name, `${wish.episodeNow}/${wish.episodes}`, '已完成');
        break;
      }
      matched = false;
      for (const priority of Object.keys(raceRuleArrs).sort((a, b) => +b - +a)) {
        const rules = raceRuleArrs[priority];
        const rule = rules[0];
        const rulesName = rules.map(item => item.alias).join('/');
        logger.debug(this.alias, '选种规则', rulesName, '开始匹配');
        const sortType = rule.sortType || 'desc';
        const sortBy = rule.sortBy || 'time';
        const numberSet = {
          desc: [-1, 1],
          asc: [1, -1]
        };
        if (sortBy === 'sitePriority') {
          torrents = torrents.sort((a, b) => b.seeders - a.seeders);
        }
        torrents = torrents.sort((a, b) => {
          if (typeof a[sortBy] === 'string') {
            return (a[sortBy] < b[sortBy] ? numberSet[sortType][1] : numberSet[sortType][0]);
          }
          return sortType === 'asc' ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy];
        });
        for (const torrent of torrents) {
          if (this.failedList[`${torrent.site}-${torrent.id}`] > 2) {
            logdebug(this.alias, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '存在推送错误历史', '跳过');
            continue;
          }
          if (!imdb && !wish.restrictYear) {
            const torrentYear = (torrent.title.match(/19\d{2}/g) || []).concat(torrent.title.match(/20\d{2}/g) || []);
            let fitYear = false;
            for (const year of torrentYear) {
              fitYear = fitYear || +year === +wish.year;
            }
            if (!fitYear) {
              logdebug(this.alias, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '未匹配首映年份:', wish.year, '跳过');
              continue;
            }
            if (wish.year > parseInt(torrent.time / 3600 / 24 / 365 + 1970)) {
              logdebug(this.alias, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '发种时间小于首映年份:', wish.year, '跳过');
              continue;
            }
          }
          if (rules.some(item => this._fitRaceRule(item, torrent, wish))) {
            let fitReject = false;
            for (const rejectRule of rejectRules) {
              if (this._fitRaceRule(rejectRule, torrent, wish)) {
                fitReject = true;
                logdebug(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '匹配成功, 同时匹配拒绝规则成功:', rejectRule.alias, '跳过');
                break;
              }
            }
            if (fitReject) continue;
            const fitRejectKeys =
              (this.categories[wish.tag].rejectKeys && !!this.categories[wish.tag].rejectKeys
                .split(',').some(item => (torrent.title.indexOf(item) !== -1 || torrent.subtitle.indexOf(item) !== -1))) ||
              (wish.rejectKeys && !!wish.rejectKeys
                .split(',').some(item => (torrent.title.indexOf(item) !== -1 || torrent.subtitle.indexOf(item) !== -1)));
            if (fitRejectKeys) {
              logdebug(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '匹配成功, 同时匹配排除关键词:', this.categories[wish.tag].rejectKeys, '/', wish.rejectKeys, '跳过');
              continue;
            }
            const fitAcceptKeys = !wish.acceptKeys || !!wish.acceptKeys
              .split(',').every(item => (torrent.title.indexOf(item) !== -1 || torrent.subtitle.indexOf(item) !== -1));
            if (!fitAcceptKeys) {
              logdebug(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '匹配成功, 同时不匹配关键词:', wish.acceptKeys, '跳过');
              continue;
            }
            if (wish.rejectCompleteTorrent && +wish.episodeNow !== 0) {
              const episode = torrent.subtitle.match(/[全]\d+[集期话]/);
              if (episode) {
                logdebug(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '匹配成功, 同时识别为全集种子', '跳过');
                continue;
              }
            }
            let episodes;
            if (wish.episodes) {
              let _subtitle = torrent.subtitle;
              if (wish.removeKeyword) {
                wish.removeKeyword.split(',').forEach((item) => { _subtitle = _subtitle.replace(new RegExp(item, 'gi'), ''); });
              }
              if (torrent.site === 'MikanProject') {
                episodes = [util.scrapeEpisodeByFilename(_subtitle)];
              } else {
                episodes = this.scrapeEpisode(_subtitle);
              }
              episodes = episodes.filter(item => +item <= wish.episodes).map(item => +item);
              episodes = [...new Set(episodes)];
              logdebug(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '识别到分集', episodes, '已完成至', wish.episodeNow);
              if (episodes.length === 0 && wish.ignoreEpisodes) {
                logdebug(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '匹配成功, 已完成至', wish.episodeNow, '未识别到分集, 但已设置忽略集数');
                episodes = [wish.episodes];
              } else {
                if (
                  episodes.some(item => +item < wish.episodeNow - 2) ||
                  !episodes.some(item => +item > wish.episodeNow)
                ) {
                  logdebug(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '匹配成功, 已完成至', wish.episodeNow, '判断结果为已下载, 跳过');
                  continue;
                }
                if (episodes.every(item => +item > wish.episodeNow + 1) && !(episodes.length === 1 && +episodes[0] === +wish.episodes && _subtitle.match(/[全共]\d+[集期话]/))) {
                  logdebug(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '匹配成功, 已完成至', wish.episodeNow, '剧集跨度过大, 跳过');
                  continue;
                }
              }
              wish.episodeNow = Math.max(...episodes.map(i => +i));
            }
            logbinge(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '匹配成功, 准备推送至下载器:', global.runningClient[this.client].alias);
            const category = this.categories[wish.tag];
            const recordNoteJson = {
              wish,
              category,
              torrent: {
                ...torrent,
                client: this.client.alias
              }
            };
            try {
              const mediaName = wish.name.split('/')[0].replace(/[?？/. ]/g, '');
              const _savePath = category.savePath.replace('{SITE}', torrent.site).replace('{NAME}', mediaName).replace('{YEAR}', wish.year);
              const _category = category.category.replace('{SITE}', torrent.site).replace('{NAME}', mediaName).replace('{YEAR}', wish.year);
              await global.runningSite[torrent.site].pushTorrentById(torrent.id, torrent.link, torrent.downloadLink, this.client, _savePath, _category, category.autoTMM, 6, JSON.stringify(recordNoteJson));
              if (episodes) {
                const maxEpisode = Math.max(...episodes.map(item => +item || 0));
                this._setEpisodeNow(wish.id, maxEpisode);
              }
            } catch (e) {
              logbinge(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '推送至下载器', global.runningClient[this.client].alias, '失败, 报错如下:\n', e);
              logger.error(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '推送至下载器', global.runningClient[this.client].alias, '失败, 报错如下:\n', e);
              await this.ntf.addDoubanTorrentError(global.runningClient[this.client], torrent, rule, wish);
              if (this.failedList[`${torrent.site}-${torrent.id}`]) {
                this.failedList[`${torrent.site}-${torrent.id}`] = this.failedList[`${torrent.site}-${torrent.id}`] + 1;
              } else {
                this.failedList[`${torrent.site}-${torrent.id}`] = 1;
              }
              throw (e);
            }
            logbinge(this.alias, '选种规则', rulesName, '种子', `[${torrent.site}]`, torrent.title, '/', torrent.subtitle, '推送至下载器', global.runningClient[this.client].alias, '成功');
            await this.ntf.addDoubanTorrent(global.runningClient[this.client], torrent, rule, wish);
            matched = true;
            _matched = true;
            break;
          };
        }
        if (matched) break;
      }
      if (!matched) {
        matchFailed = true;
        break;
      }
      if (!wish.episodes) break;
    }
    return _matched;
  }

  async wechatLink (type, options = {}) {
    const typeMap = {
      refresh: '刷新想看列表',
      refreshWish: '刷新: ' + options.key
    };
    logger.binge('豆瓣账号', this.alias, '接收微信消息', typeMap[type], '即将开始执行');
    switch (type) {
    case 'refresh':
      // this.ntf.startRefreshJob(this.alias);
      this.refreshWishList();
      break;
    case 'refreshWish':
      const wishes = this.wishes.filter(item => item.name.indexOf(options.key) !== -1 || item.id === options.key);
      for (const wish of wishes) {
        await this.refreshWish(wish.id, true);
      }
      break;
    }
  }

  async checkFinish () {
    const unfinishTorrents = await util.getRecords('select * from torrents where record_type = 6 and record_note like ?', [`%${this.id}%`]);
    for (const torrent of unfinishTorrents) {
      const client = global.runningClient[this.client];
      if (!client || !client.maindata || !client.maindata.torrents) continue;
      for (const _torrent of client.maindata.torrents) {
        if (torrent.hash !== _torrent.hash) continue;
        if (_torrent.completed === _torrent.size) {
          const recordNoteJson = JSON.parse(torrent.record_note);
          logger.binge('种子', _torrent.name, '已完成, 稍后将进行链接操作');
          await this.ntf.torrentFinish(recordNoteJson);
          try {
            await this._linkTorrentFiles(_torrent, this.client, recordNoteJson);
          } catch (e) {
            logger.error(e);
          }
          await util.runRecord('update torrents set record_type = 99 where hash = ? and rss_id = ?', [torrent.hash, torrent.rss_id]);
        }
      }
    }
  }

  clearSelectFailed () {
    this.selectTorrentToday = {};
  }

  async relink (id) {
    if (!this.linkRule) {
      logger.binge(this.alias, '本实例不含链接规则, 跳过链接操作');
      return;
    }
    await util.runRecord('update torrents set record_type = 6 where id = ?', [id]);
  }

  async search (key) {
    const json = await this._getJson('https://www.douban.com/j/search_suggest?debug=true&q=' + encodeURIComponent(key));
    const result = [];
    for (const detail of json.cards.filter(item => item.url?.indexOf('movie') !== -1)) {
      const item = {};
      item.doubanId = this.id;
      item.title = detail.title;
      item.subtitle = detail.card_subtitle;
      item.link = detail.url;
      item.poster = detail.cover_url?.replace(/img\d/, 'img9').replace('s_ratio', 'l_ratio').replace('webp', 'jpg');
      item.id = detail.url.match(/\/(\d+)\//)[1];
      item.type = detail.type;
      item.year = detail.year;
      result.push(item);
    }
    return result;
  }

  async addWish (id, tag) {
    const ck = (this.cookie.split(';').map(item => item.trim().split('=')).filter(item => item[0] === 'ck')[0] || [])[1];
    if (!ck) {
      throw new Error('Cookie 内未包含 ck 信息');
    }
    const res = await this._post(`https://movie.douban.com/j/subject/${id}/interest`, {
      ck,
      interest: 'wish',
      foldcollect: 'F',
      tags: tag,
      comment: tag
    });
    if (JSON.parse(res).r !== 0) {
      logger.error(JSON.parse(res));
      throw new Error('失败详情请查看日志');
    }
  }

  async delWish (id) {
    const ck = (this.cookie.split(';').map(item => item.trim().split('=')).filter(item => item[0] === 'ck')[0] || [])[1];
    if (!ck) {
      throw new Error('Cookie 内未包含 ck 信息');
    }
    const res = await this._post('https://movie.douban.com/j/mine/j_cat_ui', {
      ck,
      sid: `${id}:F`
    });
    if (res.indexOf('\'y\'') === -1) {
      logger.error(res);
      throw new Error('豆瓣端想看记录删除失败');
    }
  }
}
module.exports = Douban;
