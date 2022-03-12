const util = require('../libs/util');
const moment = require('moment');
const logger = require('../libs/logger');
const CronJob = require('cron').CronJob;
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
    for (const category of douban.categories) {
      this.categories[category.doubanTag] = { ...category };
    }
    this.linkRule = douban.linkRule;
    this.sites = douban.sites;
    this.client = douban.client;
    this.cron = douban.cron;
    this.enableWechatLink = douban.enableWechatLink;
    this.notify = douban.notify;
    this._notify = util.listPush().filter(i => i.id === this.notify)[0];
    this.push = douban.push;
    this._notify.push = this.push;
    this.ntf = new Push(this._notify);
    this.refreshWishJob = new CronJob(douban.cron, () => this.refreshWish());
    this.checkFinishJob = new CronJob(global.checkFinishCron, () => this.checkFinish());
    this.clearSelectFailedJob = new CronJob('0 0 * * *', () => this.clearSelectFailed());
    this.refreshWishJob.start();
    this.checkFinishJob.start();
    this.clearSelectFailedJob.start();
    this.selectTorrentToday = {};
    this.wishes = (util.listDoubanSet().filter(item => item.id === this.id)[0] || {}).wishes || [];
    logger.info('豆瓣账号', this.alias, '初始化完毕');
  };

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

  async _getDoubanInfo (url) {
    const dom = await this._getDocument(url);
    const info = {};
    // poster
    info.poster = dom.querySelector('img[title="点击看更多海报"]').getAttribute('src').replace(/img\d/, 'img9').replace('s_ratio', 'l_ratio').replace('webp', 'jpg');

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
      case '首播:':
        info.releaseAt = span.nextElementSibling.innerHTML;
        break;
      }
    }

    // year
    info.year = dom.querySelector('.year').innerHTML.match(/(\d+)/);

    // imdb
    info.imdb = dom.querySelector('#info').innerHTML.match(/(tt\d+)/);

    // desc
    info.desc = dom.querySelector('span[property="v:summary"]').innerHTML.replace(/\n +/g, '').split('<br>')[0];

    // category
    info.category = [...dom.querySelectorAll('span[property="v:genre"]')].map(item => item.innerHTML).join(' / ');

    // tag
    info.tag = dom.querySelector('span.color_gray');

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
    logger.info('豆瓣账号', this.alias, '重新载入推送方式');
    this._notify = util.listPush().filter(item => item.id === this.notify)[0] || {};
    this._notify.push = true;
    this.ntf = new Push(this.notify);
  }

  destroy () {
    logger.info('销毁豆瓣实例', this.alias);
    this.refreshWishJob.stop();
    this.checkFinishJob.stop();
    this.clearSelectFailedJob.stop();
    delete global.runningClient[this.id];
  };

  async refreshWish () {
    const document = await this._getDocument('https://movie.douban.com/mine?status=wish');
    const items = document.querySelectorAll('.article .grid-view .item');
    const wishes = [];
    for (const item of items) {
      const wish = {};
      wish.name = item.querySelector('li[class=title] em').innerHTML;
      wish.link = item.querySelector('li[class=title] a').href;
      wish.poster = item.querySelector('a[class=nbg] img').src.trim().replace(/img\d/, 'img9').replace('s_ratio', 'l_ratio').replace('webp', 'jpg');
      wish.id = wish.link.match(/\/(\d+)\//)[1];
      wishes.push(wish);
    }
    const _doubanSet = util.listDoubanSet().filter(item => item.id === this.id)[0];
    if (!_doubanSet) {
      this.wishes = wishes.map(item => {
        logger.info('豆瓣账户', this.alias, '首次添加想看列表', item.name, '已设为已下载');
        return { ...item, downloaded: true };
      });
      this._saveSet();
      await this.ntf.addDouban(this.alias, wishes);
    } else {
      for (const wish of this.wishes) {
        if (wish.downloaded && (!wish.episodes || (wish.episodeNow === wish.episodes))) continue;
        logger.info('豆瓣账户:', this.alias, '想看:', wish.name, '上次未选种成功或未更新完毕, 即将重新尝试选种');
        try {
          if (!this.categories[wish.tag]) {
            logger.info('豆瓣账户', this.alias, wish.name, '标签分类', wish.tag, '未定义, 跳过');
            continue;
          }
          wish.downloaded = await this.selectTorrent(wish);
          this._saveSet();
          if (!wish.downloaded && !this.selectTorrent[wish.id]) {
            logger.info(this.alias, '未匹配种子', wish.name);
            this.ntf.selectTorrentError(this.alias, wish);
            this.selectTorrent[wish.id] = 1;
          }
        } catch (e) {
          logger.error('豆瓣账户:', this.alias, '选种', wish.name, '失败:\n', e);
          wish.downloaded = false;
        }
      }
      for (const wish of wishes) {
        if (!this.wishes.filter(item => item.id === wish.id)[0]) {
          logger.info('豆瓣账户', this.alias, wish.name, '已添加入想看列表, 稍后将开始处理');
          const doubanInfo = await this._getDoubanInfo(wish.link);
          const imdb = doubanInfo.imdb;
          const tag = doubanInfo.tag;
          const year = doubanInfo.year;
          if (!tag) {
            logger.info('豆瓣账户', this.alias, wish.name, '未添加标签, 跳过');
            continue;
          }
          const type = tag.innerHTML.trim().replace('标签:', '');
          wish.imdb = imdb ? imdb[1] : null;
          wish.year = year ? year[1] : null;
          wish.rating = doubanInfo.rating;
          wish.length = doubanInfo.length;
          wish.area = doubanInfo.area;
          wish.language = doubanInfo.language;
          wish.length = doubanInfo.length;
          wish.category = doubanInfo.category;
          wish.desc = doubanInfo.desc;
          wish.tag = type;
          wish.mainCreator = doubanInfo.mainCreator;
          if (!wish.tag) {
            logger.info('豆瓣账户', this.alias, wish.name, '未识别到标签, 跳过');
            continue;
          }
          const episodes = doubanInfo.episodes;
          if (episodes.length !== 0) {
            wish.episodes = +episodes[episodes.length - 1].href.match(/episode\/(\d+)/)[1];
            wish.episodeNow = 0;
          }
          const fitTag = Object.keys(this.categories).filter(item => wish.tag.indexOf(item) !== -1);
          if (!fitTag[0]) {
            logger.info('豆瓣账户', this.alias, wish.name, '标签分类', wish.tag, '未检索到标签, 跳过');
            continue;
          }
          wish.tag = fitTag[0];
          try {
            await this.ntf.addDoubanWish(this.alias, wish);
            this.wishes.push(wish);
            wish.downloaded = await this.selectTorrent(wish);
            this._saveSet();
            if (!wish.downloaded) {
              logger.info(this.alias, '未匹配种子', wish.name);
              this.ntf.selectTorrentError(this.alias, wish);
            }
          } catch (e) {
            logger.error('豆瓣账户:', this.alias, '选种', wish.name, '失败:\n', e);
            wish.downloaded = false;
            this.ntf.selectTorrentError(this.alias, wish, `执行报错: ${e.message}`);
          }
          this._saveSet();
        }
      };
      this._saveSet();
    }
  }

  _saveSet () {
    const set = {
      id: this.id,
      wishes: this.wishes
    };
    fs.writeFileSync(path.join(__dirname, '../data/douban/set', this.id + '.json'), JSON.stringify(set, null, 2));
  };

  _fitConditions (_torrent, conditions) {
    let fit = true;
    const torrent = { ..._torrent };
    torrent.time = moment().unix() - torrent.time;
    torrent.tags = torrent.tags.join(',');
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
      }
    }
    return fit;
  }

  _fitRaceRule (_rule, torrent) {
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
        fit = rule.conditions.length !== 0 && this._fitConditions(torrent, rule.conditions);
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
        wish.episodeNow = episodeNow;
        logger.info(wish.name, '更新至', episodeNow);
        this._saveSet();
      }
    }
  }

  async _linkTorrentFiles (torrent, client, recordNoteJson) {
    if (!this.linkRule) {
      logger.info(this.alias, '本实例不含链接规则, 跳过软链接操作');
      return;
    }
    const linkRule = util.listLinkRule().filter(item => item.id === this.linkRule)[0];
    let size = 1;
    linkRule.minFileSize.split('*').forEach(i => { size *= +i; });
    linkRule.minFileSize = size;
    const files = await global.runningClient[client].getFiles(torrent.hash);
    const wish = recordNoteJson.wish;
    const _torrent = recordNoteJson.torrent;
    const category = recordNoteJson.category;
    if (category.type === 'series') {
      let newEpisode = 0;
      for (const file of files) {
        if (file.size < linkRule.minFileSize) continue;
        const seriesName = wish.name.split('/')[0].trim();
        let season = (file.name.match(/[. ]S(\d+)/) || [0, null])[1];
        let episode = +(file.name.match(/E[Pp]?(\d+)[. ]/) || [0, '01'])[1];
        const part = (file.name.match(/\.[Pp][Aa][Rr][Tt]\.*[A1][B2]/));
        if (part?.[1]) {
          episode = part?.[1] === 'A' || part?.[1] === '1' ? episode * 2 - 1 : episode * 2;
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
            }[seasonSubtitle];
          }
        }
        if (season === null) {
          const seasonSubtitle = _torrent.subtitle.replace(/ /g, '').match(/第(\d+)[季部]/);
          if (seasonSubtitle) {
            season = +seasonSubtitle[1];
          }
        }
        season = season || 1;
        newEpisode = Math.max(episode, newEpisode);
        episode = 'E' + '0'.repeat(3 - ('' + episode).length) + episode;
        season = 'S' + '0'.repeat(2 - ('' + season).length) + season;
        const fileExt = path.extname(file.name);
        const linkFilePath = path.join(linkRule.linkFilePath, category.libraryPath, seriesName, season);
        const linkFile = path.join(linkFilePath, season + episode + fileExt);
        const targetFile = path.join(torrent.savePath.replace(linkRule.targetPath.split('##')[0], linkRule.targetPath.split('##')[1]), file.name);
        const command = `mkdir -p '${linkFilePath}' && ln -s '${targetFile}' '${linkFile}'`;
        try {
          await global.runningServer[linkRule.server].run(command);
        } catch (e) {
          logger.error(e);
        }
      }
      if (newEpisode) {
        this._setEpisodeNow(wish.id, newEpisode);
      }
    } else if (category.type === 'movie') {
      for (const file of files) {
        if (file.size < linkRule.minFileSize) continue;
        const movieName = wish.name.split('/')[0].trim();
        const year = (file.name.match(/[. ](20\d\d)[. ]/) || file.name.match(/[. ](19\d\d)[. ]/) || ['', ''])[1];
        const fileExt = path.extname(file.name);
        const linkFilePath = path.join(linkRule.linkFilePath, category.libraryPath);
        const linkFile = path.join(linkFilePath, `${movieName}.${year}${fileExt}`);
        const targetFile = path.join(torrent.savePath.replace(linkRule.targetPath.split('##')[0], linkRule.targetPath.split('##')[1]), file.name);
        const command = `mkdir -p '${linkFilePath}' && ln -s '${targetFile}' '${linkFile}'`;
        await global.runningServer[linkRule.server].run(command);
      }
    }
  }

  async selectTorrent (_wish) {
    const wish = { ..._wish };
    wish.doubanId = this.id;
    if (!wish.imdb) wish.imdb = wish.name.split('/')[0].trim();
    logger.info(this.alias, '启动豆瓣选剧, 影片:', wish.name, '豆瓣ID:', wish.id, 'imdb:', wish.imdb, '开始搜索以下站点:', this.sites.join(', '));
    const result = await Promise.all(this.sites.map(i => global.runningSite[i].search(wish.name.split('/')[0].trim())));
    let torrents = result.map(i => i.torrentList).flat();
    logger.info(this.alias, '种子搜索已完成, 共计查找到', torrents.length, '个种子');
    const raceRuleList = util.listRaceRule();
    const rejectRules = this.rejectRules
      .map(i => raceRuleList.filter(ii => ii.id === i)[0])
      .filter(i => i);
    const raceRules = this.raceRules
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
    logger.info(this.alias, '选种规则总计:', raceRules.length, ' 开始按照优先级查找');
    for (const priority of Object.keys(raceRuleArrs).sort((a, b) => +b - +a)) {
      const rules = raceRuleArrs[priority];
      const rule = rules[0];
      const rulesName = rules.map(item => item.alias).join('/');
      logger.info(this.alias, '选种规则:', rulesName, '开始匹配');
      const sortType = rule.sortType || 'desc';
      const sortKey = rule.sortKey || 'time';
      const numberSet = {
        desc: [-1, 1],
        asc: [1, -1]
      };
      torrents = torrents.sort((a, b) => {
        if (typeof a[sortKey] === 'string') {
          return (a[sortKey] < b[sortKey] ? numberSet[sortType][1] : numberSet[sortType][0]);
        }
        return sortType === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
      });
      for (const torrent of torrents) {
        if (rules.some(item => this._fitRaceRule(item, torrent))) {
          let fitReject = false;
          for (const rejectRule of rejectRules) {
            if (this._fitRaceRule(rejectRule, torrent)) {
              fitReject = true;
              logger.info(this.alias, '选种规则:', rulesName, '种子:', torrent.title, '/', torrent.subtitle, '匹配成功, 同时匹配拒绝规则成功:', rejectRule.alias, '跳过');
              break;
            }
          }
          if (fitReject) continue;
          const fitRejectKeys = this.categories[wish.tag].rejectKeys && !!this.categories[wish.tag].rejectKeys
            .split(',').some(item => (torrent.title.indexOf(item) !== -1 || torrent.subtitle.indexOf(item) !== -1));
          if (fitRejectKeys) {
            logger.info(this.alias, '选种规则:', rulesName, '种子:', torrent.title, '/', torrent.subtitle, '匹配成功, 同时匹配排除关键词:', this.categories[wish.tag].rejectKeys, '跳过');
            continue;
          }
          const torrentYear = (torrent.title.match(/19\d{2}/g) || []).concat(torrent.title.match(/20\d{2}/g) || []);
          let fitYear = false;
          for (const year of torrentYear) {
            fitYear = fitYear || +year === +wish.year;
          }
          if (!fitYear) {
            logger.info(this.alias, '选种规则:', rulesName, '种子:', torrent.title, '/', torrent.subtitle, '匹配成功, 未匹配首映年份:', wish.year, '跳过');
            continue;
          }
          if (wish.year > parseInt(torrent.time / 3600 * 24 * 365 + 1970)) {
            logger.info(this.alias, '选种规则:', rulesName, '种子:', torrent.title, '/', torrent.subtitle, '匹配成功, 发种时间小于首映年份:', wish.year, '跳过');
            continue;
          }
          let episodes;
          if (wish.episodes) {
            const subtitle = torrent.subtitle.replace(/ /g, '').replace(/[Hh][Dd][Rr]10/g, '').replace(/\d{4}-\d{1,2}-\d{1,2}/g, '');
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
            const episodeTypeA = (subtitle.match(/E?\d{1,3}-E?\d{1,3}/g) || []).map(item => item.replace(/E/g, '').split('-'))[0] || [];
            const episodeTypeB = (subtitle.replace(/[Hh][Dd][Rr]10/g, '').match(/[^\d][第全]E?\d{2,3}[^\d帧Ff]/g) || []).map(item => item.match(/\d{2,3}/g)).flat() || [];
            const episodeTypeC = (subtitle.replace(/[Hh][Dd][Rr]10/g, '').match(/[^\d][第全]E?\d[^\dKk]/g) || []).map(item => item.match(/\d/g)).flat() || [];
            const episodeTypeD = ((subtitle.match(/全[一二三四五六七八九十]集/g) || []).map(item => item.match(/[一二三四五六七八九十]/g)).flat() || []).map(item => episodeMap[item]);
            episodes = episodeTypeA.concat(episodeTypeB).concat(episodeTypeC).concat(episodeTypeD);
            logger.debug(this.alias, '选种规则:', rulesName, '种子:', torrent.title, '分集', wish.episodeNow, episodes);
            if (episodes.some(item => +item <= wish.episodeNow) || episodes.length === 0) {
              logger.info(this.alias, '选种规则:', rulesName, '种子:', torrent.title, '/', torrent.subtitle, '匹配成功, 已完成至:', wish.episodeNow, '判断结果为已下载, 跳过');
              continue;
            }
            wish.episodeNow = Math.max(...episodes.map(i => +i));
          }
          logger.info(this.alias, '选种规则:', rulesName, '种子:', torrent.title, '/', torrent.subtitle, '匹配成功, 准备推送至下载器:', global.runningClient[this.client].alias);
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
            const _savePath = category.savePath.replace('{SITE}', torrent.site);
            const _category = category.category.replace('{SITE}', torrent.site);
            await global.runningSite[torrent.site].pushTorrentById(torrent.id, torrent.downloadLink, this.client, _savePath, _category, category.autoTMM, 6, JSON.stringify(recordNoteJson));
            if (episodes) {
              const maxEpisode = Math.max(...episodes.map(item => +item || 0));
              this._setEpisodeNow(wish.id, maxEpisode);
            }
          } catch (e) {
            logger.error(this.alias, '选种规则:', rulesName, '种子:', torrent.title, '/', torrent.subtitle, '推送至下载器:', global.runningClient[this.client].alias, '失败, 报错如下:\n', e);
            await this.ntf.addDoubanTorrentError(global.runningClient[this.client], torrent, rule, wish);
            throw (e);
          }
          logger.info(this.alias, '选种规则:', rulesName, '种子:', torrent.title, '/', torrent.subtitle, '推送至下载器:', global.runningClient[this.client].alias, '成功');
          await this.ntf.addDoubanTorrent(global.runningClient[this.client], torrent, rule, wish);
          return true;
        };
      }
    }
    return false;
  }

  async wechatLink (type) {
    const typeMap = {
      refresh: '刷新想看列表'
    };
    logger.info('豆瓣账号', this.alias, '接收微信消息', typeMap[type], '即将开始执行');
    this.ntf.startRefreshJob(this.alias);
    this.refreshWish();
  }

  async checkFinish () {
    const unfinishTorrents = await util.getRecords('select * from torrents where record_type = 6 and record_note like ?', [`%${this.id}%`]);
    for (const torrent of unfinishTorrents) {
      for (const _client of Object.keys(global.runningClient)) {
        const client = global.runningClient[_client];
        if (!client || !client.maindata || !client.maindata.torrents) continue;
        for (const _torrent of client.maindata.torrents) {
          if (torrent.hash !== _torrent.hash) continue;
          logger.debug(torrent, _torrent, client.alias);
          if (_torrent.completed === _torrent.size) {
            const recordNoteJson = JSON.parse(torrent.record_note);
            logger.info('种子', _torrent.name, '已完成, 稍后将进行软链接操作');
            await this.ntf.torrentFinish(recordNoteJson);
            try {
              await this._linkTorrentFiles(_torrent, _client, recordNoteJson);
            } catch (e) {
              logger.error(e);
            }
            await util.runRecord('update torrents set record_type = 99 where hash = ? and rss_id = ?', [torrent.hash, torrent.rss_id]);
          }
        }
      }
    }
  }

  clearSelectFailed () {
    this.selectTorrentToday = {};
  }
}
module.exports = Douban;
