const util = require('../libs/util');
const moment = require('moment');
const logger = require('../libs/logger');
const CronJob = require('cron').CronJob;
const Push = require('./Push');
const path = require('path');

class Race {
  constructor (race) {
    this.id = race.id;
    this.alias = race.alias;
    this.sites = race.sites;
    this.enable = race.enable;
    this.keyword = race.keyword;
    this.raceRules = race.raceRules;
    this.linkRule = race.linkRule;
    this.client = race.client;
    this.savePath = race.savePath;
    this.category = race.category;
    this.autoTMM = race.autoTMM;
    this.cron = race.cron;
    this.notify = race.notify;
    this._notify = util.listPush().filter(i => i.id === this.notify)[0];
    this.push = race.push;
    this._notify.push = this.push;
    this.ntf = new Push(this._notify);
    this.raceJob = new CronJob(race.cron, () => this.race());
    this.raceJob.start();
  };

  destroy () {
    logger.info('销毁自动追剧实例', this.alias);
    this.raceJob.stop();
    delete global.runningRace[this.id];
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
        logger.error('下载器, ', this.alias, '选种规则', rule.alias, '存在语法错误\n', e);
        return false;
      }
    } else {
      try {
        fit = rule.conditions.length !== 0 && this._fitConditions(torrent, rule.conditions);
      } catch (e) {
        logger.error('下载器, ', this.alias, '选种规则', rule.alias, '遇到错误\n', e);
        return false;
      }
    }
    return fit;
  };

  async _linkTorrentFiles (torrent, client, race) {
    const linkRule = util.listLinkRule().filter(item => item.id === this.linkRule)[0];
    let size = 1;
    linkRule.minFileSize.split('*').forEach(i => { size *= +i; });
    linkRule.minFileSize = size;
    const files = await global.runningClient[client].getFiles(torrent.hash);
    for (const file of files) {
      if (file.size < linkRule.minFileSize) continue;
      const seriesName = race.raceAlias.split('-')[0].trim();
      const season = (file.name.match(/(S\d\d)/) || [0, 'S01'])[1];
      const episode = (file.name.match(/(E\d\d)/) || [0, 'E01'])[1];
      const fileExt = path.extname(file.name);
      const linkFilePath = path.join(linkRule.linkFilePath, 'series', seriesName, season);
      const linkFile = path.join(linkFilePath, season + episode + fileExt);
      const targetFile = path.join(torrent.savePath.replace(linkRule.targetPath.split('##')[0], linkRule.targetPath.split('##')[1]), file.name);
      const command = `mkdir -p '${linkFilePath}' && ln -s '${targetFile}' '${linkFile}'`;
      await global.runningServer[linkRule.server].run(command);
    }
  }

  async race () {
    logger.info(this.alias, '启动追剧任务, 开始搜索以下站点:', this.sites.join(', '));
    const result = await Promise.all(this.sites.map(i => global.runningSite[i].search(this.keyword)));
    const torrents = result.map(i => i.torrentList).flat();
    logger.info(this.alias, '种子搜索已完成, 共计查找到', torrents.length, '个种子');
    const raceRuleList = util.listRaceRule();
    const raceRules = this.raceRules
      .map(i => raceRuleList.filter(ii => ii.id === i)[0])
      .filter(i => i)
      .sort((a, b) => +b.priority - +a.priority);
    logger.info(this.alias, '选种规则总计', raceRules.length, ', 开始按照优先级查找');
    for (const rule of raceRules) {
      logger.info(this.alias, '选种规则:', rule.alias, '开始匹配');
      for (const torrent of torrents) {
        if (this._fitRaceRule(rule, torrent)) {
          logger.info(this.alias, '选种规则:', rule.alias, ',种子:', torrent.title, '/', torrent.subtitle, '匹配成功, 准备推送至下载器:', global.runningClient[this.client].alias);
          try {
            const noteJson = {
              race: this.id,
              raceAlias: this.alias
            };
            await global.runningSite[torrent.site].pushTorrentById(torrent.id, torrent.downloadLink, this.client, this.savePath, this.category, this.autoTMM, 5, JSON.stringify(noteJson));
          } catch (e) {
            logger.error(this.alias, '选种规则:', rule.alias, ',种子:', torrent.title, '/', torrent.subtitle, '推送至下载器:', global.runningClient[this.client].alias, '失败, 报错如下:\n', e);
            return await this.ntf.addRaceTorrentError(this.alias, global.runningClient[this.client].alias, torrent.title, rule.alias);
          }
          logger.info(this.alias, '选种规则:', rule.alias, ',种子:', torrent.title, '/', torrent.subtitle, '推送至下载器:', global.runningClient[this.client].alias, '成功');
          await this.ntf.addRaceTorrent(this.alias, global.runningClient[this.client].alias, torrent.title, rule.alias);
          return;
        };
      }
    }
    logger.info(this.alias, '匹配完毕, 没有查找到满足规则的种子');
  }
}
module.exports = Race;
