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
    this.notify = douban.notify;
    this._notify = util.listPush().filter(i => i.id === this.notify)[0];
    this.push = douban.push;
    this._notify.push = this.push;
    this.ntf = new Push(this._notify);
    this.refreshWishJob = new CronJob(douban.cron, () => this.refreshWish());
    this.checkFinishJob = new CronJob(global.checkFinishCron, () => this.checkFinish());
    this.refreshWishJob.start();
    this.checkFinishJob.start();
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

  destroy () {
    logger.info('销毁豆瓣实例', this.alias);
    this.refreshWishJob.stop();
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
      const doubanSet = {
        id: this.id,
        wishes: wishes.map(item => {
          logger.info('豆瓣账户', this.alias, '首次添加想看列表', item.name, '已设为已下载');
          return { ...item, downloaded: true };
        })
      };
      fs.writeFileSync(path.join(__dirname, '../data/douban/set', this.id + '.json'), JSON.stringify(doubanSet, null, 2));
      await this.ntf.addDouban(this.alias, wishes);
    } else {
      const newWishes = [];
      const doubanSet = { ..._doubanSet };
      for (const wish of doubanSet.wishes) {
        if (wish.downloaded) continue;
        logger.info('豆瓣账户:', this.alias, '想看:', wish.name, '上次未选种成功, 即将重新尝试选种');
        try {
          if (!this.categories[wish.tag]) {
            logger.info('豆瓣账户', this.alias, wish.name, '标签分类', wish.tag, '未定义, 跳过');
            continue;
          }
          wish.downloaded = await this.selectTorrent(wish);
          if (!wish.downloaded) {
            logger.info(this.alias, '未匹配种子', wish.name);
            this.ntf.selectTorrentError(this.alias, `未匹配种子: ${wish.name}`);
          }
        } catch (e) {
          logger.error('豆瓣账户:', this.alias, '选种', wish.name, '失败:\n', e);
          wish.downloaded = false;
        }
      }
      for (const wish of wishes) {
        if (!doubanSet.wishes.filter(item => item.id === wish.id)[0]) {
          logger.info('豆瓣账户', this.alias, wish.name, '已添加入想看列表, 稍后将开始处理');
          const details = await this._getDocument(wish.link);
          const imdb = details.querySelector('#info').innerHTML.match(/(tt\d+)/);
          const tag = details.querySelector('span.color_gray');
          if (!tag) {
            logger.info('豆瓣账户', this.alias, wish.name, '未添加标签, 跳过');
            continue;
          }
          const type = tag.innerHTML.trim().replace('标签:', '');
          wish.imdb = imdb ? imdb[1] : null;
          wish.tag = type.match(/#(.+?)#/);
          if (!wish.tag) {
            logger.info('豆瓣账户', this.alias, wish.name, '未识别到分类, 跳过');
            continue;
          }
          wish.tag = wish.tag[1];
          if (!this.categories[wish.tag]) {
            logger.info('豆瓣账户', this.alias, wish.name, '标签分类', wish.tag, '未定义, 跳过');
            continue;
          }
          try {
            wish.downloaded = await this.selectTorrent(wish);
            if (!wish.downloaded) {
              logger.info(this.alias, '未匹配种子', wish.name);
              this.ntf.selectTorrentError(this.alias, `未匹配种子: ${wish.name}`);
            }
          } catch (e) {
            logger.error('豆瓣账户:', this.alias, '选种', wish.name, '失败:\n', e);
            wish.downloaded = false;
            this.ntf.selectTorrentError(this.alias, `执行报错: ${e.message}`);
          }
          doubanSet.wishes.push(wish);
          newWishes.push(wish);
        }
      };
      fs.writeFileSync(path.join(__dirname, '../data/douban/set', this.id + '.json'), JSON.stringify(doubanSet, null, 2));
      if (newWishes.length !== 0) {
        await this.ntf.addDoubanWish(this.alias, newWishes);
      }
    }
  }

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
    const category = recordNoteJson.category;
    if (category.type === 'series') {
      for (const file of files) {
        if (file.size < linkRule.minFileSize) continue;
        const seriesName = wish.name.split('/')[0].trim();
        const season = (file.name.match(/[. ](S\d+)/) || [0, 'S01'])[1];
        let episode = +(file.name.match(/E(\d+)[. ]/) || [0, '01'])[1];
        const part = (file.name.match(/\.[Pp][Aa][Rr][Tt]\.*[A1][B2]/));
        if (part?.[1]) {
          episode = part?.[1] === 'A' || part?.[1] === '1' ? episode * 2 - 1 : episode * 2;
        }
        episode = 'E' + '0'.repeat(3 - ('' + episode).length) + episode;
        const fileExt = path.extname(file.name);
        const linkFilePath = path.join(linkRule.linkFilePath, category.libraryPath, seriesName, season);
        const linkFile = path.join(linkFilePath, season + episode + fileExt);
        const targetFile = path.join(torrent.savePath.replace(linkRule.targetPath.split('##')[0], linkRule.targetPath.split('##')[1]), file.name);
        const command = `mkdir -p '${linkFilePath}' && ln -s '${targetFile}' '${linkFile}'`;
        await global.runningServer[linkRule.server].run(command);
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
    const raceRules = this.raceRules
      .map(i => raceRuleList.filter(ii => ii.id === i)[0])
      .filter(i => i)
      .sort((a, b) => +b.priority - +a.priority);
    logger.info(this.alias, '选种规则总计:', raceRules.length, ' 开始按照优先级查找');
    for (const rule of raceRules) {
      logger.info(this.alias, '选种规则:', rule.alias, '开始匹配');
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
        if (this._fitRaceRule(rule, torrent)) {
          const rejectRules = this.rejectRules
            .map(i => raceRuleList.filter(ii => ii.id === i)[0])
            .filter(i => i);
          let fitReject = false;
          for (const rejectRule of rejectRules) {
            if (this._fitRaceRule(rejectRules, torrent)) {
              fitReject = true;
              logger.info(this.alias, '选种规则:', rule.alias, '种子:', torrent.title, '/', torrent.subtitle, '匹配成功, 同时匹配拒绝规则成功:', rejectRule.alias, '跳过');
              break;
            }
          }
          if (fitReject) continue;
          const fitRejectKeys = !!this.categories[wish.tag].rejectKeys
            .split(',').some(item => (torrent.title.indexOf(item) !== -1 || torrent.subtitle.indexOf(item) !== -1));
          if (fitRejectKeys) {
            logger.info(this.alias, '选种规则:', rule.alias, '种子:', torrent.title, '/', torrent.subtitle, '匹配成功, 同时匹配排除关键词:', this.categories[wish.tag].rejectKeys, '跳过');
            break;
          }
          logger.info(this.alias, '选种规则:', rule.alias, '种子:', torrent.title, '/', torrent.subtitle, '匹配成功, 准备推送至下载器:', global.runningClient[this.client].alias);
          const category = this.categories[wish.tag];
          const recordNoteJson = {
            wish,
            category,
            torrent
          };
          try {
            await global.runningSite[torrent.site].pushTorrentById(torrent.id, torrent.downloadLink, this.client, category.savePath, category.category, category.autoTMM, 6, JSON.stringify(recordNoteJson));
          } catch (e) {
            logger.error(this.alias, '选种规则:', rule.alias, '种子:', torrent.title, '/', torrent.subtitle, '推送至下载器:', global.runningClient[this.client].alias, '失败, 报错如下:\n', e);
            await this.ntf.addDoubanTorrentError(this.alias, global.runningClient[this.client], torrent, rule, wish);
            throw (e);
          }
          logger.info(this.alias, '选种规则:', rule.alias, '种子:', torrent.title, '/', torrent.subtitle, '推送至下载器:', global.runningClient[this.client].alias, '成功');
          await this.ntf.addDoubanTorrent(this.alias, global.runningClient[this.client], torrent, rule, wish);
          return true;
        };
      }
    }
    return false;
  }

  async checkFinish () {
    const unfinishTorrents = await util.getRecords('select * from torrents where record_type = 6 and record_note like ?', [`%${this.id}%`]);
    for (const torrent of unfinishTorrents) {
      for (const _client of Object.keys(global.runningClient)) {
        const client = global.runningClient[_client];
        if (!client || !client.maindata || !client.maindata.torrents) continue;
        for (const _torrent of client.maindata.torrents) {
          if (torrent.hash !== _torrent.hash) continue;
          if (_torrent.completed === _torrent.size) {
            logger.info('种子', _torrent.name, '已完成, 稍后将进行软链接操作');
            await this.ntf.torrentFinish(torrent, '');
            const recordNoteJson = JSON.parse(torrent.record_note);
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
}
module.exports = Douban;
