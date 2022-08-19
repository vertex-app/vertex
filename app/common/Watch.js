const util = require('../libs/util');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const Push = require('./Push');
const logger = require('../libs/logger');

class Watch {
  constructor (watch) {
    this.cron = watch.cron;
    this.alias = watch.alias;
    this.id = watch.id;
    this.linkRule = watch.linkRule;
    this.category = watch.category;
    this.type = watch.type;
    this.notify = util.listPush().filter(item => item.id === watch.notify)[0] || {};
    this.notify.push = !!watch.notify;
    this.ntf = new Push(this.notify);
    this.libraryPath = watch.libraryPath;
    this.downloader = watch.downloader;
    this.forceScrape = watch.forceScrape || [];
    this.torrents = util.listWatchSet().filter(item => item.id === this.id)[0]?.torrents || {};
    this._saveSet();
    // eslint-disable-next-line no-eval
    this.job = cron.schedule(this.cron, async () => { try { await this._scanCategory(); } catch (e) { logger.error(e); } });
  };

  async _scanCategory () {
    const downloader = global.runningClient[this.downloader];
    if (!downloader || !downloader.maindata) {
      logger.error('监控任务', this.alias, '下载器', this.downloader, '未启动或状态不正常, 退出任务');
      return;
    }
    const torrents = [];
    for (const torrent of downloader.maindata.torrents) {
      if (
        (torrent.category === this.category || torrent.savePath === this.category) &&
        ['uploading', 'stalledUP', 'Seeding'].indexOf(torrent.state) !== -1
      ) {
        torrents.push({ ...torrent });
      }
    }
    if (util.listWatchSet().filter(item => item.id === this.id).length === 0) {
      for (const torrent of torrents) {
        this.torrents[torrent.hash] = { name: torrent.name, size: torrent.size };
      }
      this._saveSet();
      return;
    }
    for (const torrent of torrents) {
      if (!this.torrents[torrent.hash]) {
        logger.watch('检测到新种子', torrent.name, '已完成, 开始识别');
        try {
          const forceScrape = this.forceScrape.filter(item => torrent.name.indexOf(item.keyword) !== -1)[0];
          let _name;
          let _season;
          if (forceScrape) {
            _name = forceScrape.name;
            _season = forceScrape.season;
          }
          if (_season === '') {
            _season = false;
          }
          const { name, year, type } = await util.scrapeNameByFile(_name || torrent.name, this.type === 'series' ? 'tv' : this.type ? 'movie' : '', true);
          torrent.scrapedName = name;
          torrent.year = year;
          torrent.type = type === 'tv' ? 'series' : type === 'movie' ? 'movie' : this.type;
          if (!name || !year) {
            logger.error(`${torrent.name} 识别失败: ${name}.${year} ${torrent.type}`);
            this.ntf.scrapeTorrentFailed(this.alias, torrent.name);
          } else {
            this.ntf.scrapeTorrent(this.alias, torrent.name, `${name}.${year} ${torrent.type}`);
            logger.watch(`${torrent.name} 识别结果: ${name}.${year || ''} ${torrent.type}`);
            await this._linkTorrentFiles(torrent, this.downloader, name, _season, year, torrent.type);
          }
          this.torrents[torrent.hash] = {
            name: torrent.name,
            size: torrent.size,
            scrapedName: name,
            year: year,
            type: type
          };
          this._saveSet();
        } catch (e) {
          logger.error(e);
          this.ntf.scrapeTorrentFailed(this.alias, torrent.name, `${e.message}`);
        }
      }
    }
  };

  async _linkTorrentFiles (torrent, client, name, _season, year, type) {
    const linkRule = util.listLinkRule().filter(item => item.id === this.linkRule)[0];
    let size = 1;
    linkRule.minFileSize.split('*').forEach(i => { size *= +i; });
    linkRule.minFileSize = size;
    const files = await global.runningClient[client].getFiles(torrent.hash);
    if (type === 'series') {
      for (const file of files) {
        const filename = path.basename(file.name);
        if (file.size < linkRule.minFileSize) continue;
        if (linkRule.excludeKeys && linkRule.excludeKeys.split(',').some(item => filename.indexOf(item) !== -1)) continue;
        const seriesName = name;
        let season = (filename.match(/[. ]S(\d+)/) || [0, null])[1];
        let episode = util.scrapeEpisodeByFilename(filename);
        if (!episode) {
          continue;
        }
        let fakeEpisode = 0;
        const part = (filename.match(/[ .]?[Pp][Aa][Rr][Tt][ .]?0?([abAB12])/));
        if (part?.[1]) {
          fakeEpisode = part?.[1] === 'A' || part?.[1] === '1' ? episode * 2 - 1 : episode * 2;
        }
        if (season === null) {
          const seasonSubtitle = name.replace(/ +/g, '').match(/第([一二三四五六七八九十])[季部]/);
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
          const seasonSubtitle = name.replace(/ /g, '').match(/第(\d+)[季部]/);
          if (seasonSubtitle) {
            season = +seasonSubtitle[1];
          }
        }
        season = season || 1;
        episode = (fakeEpisode || episode);
        episode = 'E' + '0'.repeat(Math.max(2 - ('' + episode).length, 0)) + (episode);
        season = 'S' + '0'.repeat(2 - ('' + season).length) + season;
        if (_season) {
          season = _season;
        }
        const prefix = linkRule.keepSeriesName ? seriesName + '.' : '';
        const suffixKeys = [];
        const reservedKeys = (linkRule.reservedKeys || '').split(',');
        for (const key of reservedKeys) {
          if (filename.indexOf(key) !== -1) {
            suffixKeys.push(key);
          }
        }
        const suffix = suffixKeys[0] ? '-' + suffixKeys.filter(key => !suffixKeys.some(item => item.indexOf(key) !== -1 && item !== key)).join('.') : '';
        let group = '';
        if (linkRule.group) {
          group = (filename.match(/[-￡][^-￡]*?$/) || [''])[0].replace(/[-￡]/, '-');
        }
        const fileExt = path.extname(file.name);
        group = group.replace(fileExt, '');
        const linkFilePath = path.join(linkRule.linkFilePath, this.libraryPath.split(':')[1], `${seriesName}(${year})`, season).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, prefix + season + episode + suffix + group + fileExt).replace(/'/g, '\\\'');
        const targetFile = path.join(torrent.savePath.replace(linkRule.targetPath.split('##')[0], linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const linkMode = linkRule.hardlink ? 'f' : 'sf';
        const command = `mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
        logger.watch(this.alias, '执行链接命令', command);
        try {
          await global.runningServer[linkRule.server].run(command);
        } catch (e) {
          logger.error(e);
        }
      }
    } else if (type === 'movie') {
      for (const file of files) {
        if (file.size < linkRule.minFileSize) continue;
        if (linkRule.excludeKeys && linkRule.excludeKeys.split(',').some(item => file.name.indexOf(item) !== -1)) continue;
        const movieName = name;
        const filename = file.name;
        const _year = year || (filename.match(/[. ](20\d\d)[. ]/) || filename.match(/[. ](19\d\d)[. ]/) || ['', ''])[1];
        const suffixKeys = [];
        const reservedKeys = (linkRule.reservedKeys || '').split(',');
        for (const key of reservedKeys) {
          if (filename.indexOf(key) !== -1) {
            suffixKeys.push(key);
          }
        }
        const suffix = suffixKeys[0] ? '-' + suffixKeys.filter(key => !suffixKeys.some(item => item.indexOf(key) !== -1 && item !== key)).join('.') : '';
        let group = '';
        if (linkRule.group) {
          group = (filename.match(/[-￡][^-￡]*?$/) || [''])[0].replace(/[-￡]/, '-');
        }
        const fileExt = path.extname(filename);
        group = group.replace(fileExt, '');
        const linkFilePath = path.join(linkRule.linkFilePath, this.libraryPath.split(':')[1], `${movieName}.${_year}`).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, `${movieName}.${_year}${suffix + group}${fileExt}`).replace(/'/g, '\\\'');
        const targetFile = path.join(torrent.savePath.replace(linkRule.targetPath.split('##')[0], linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const linkMode = linkRule.hardlink ? 'f' : 'sf';
        const command = `mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
        logger.watch(this.alias, '执行链接命令', command);
        try {
          await global.runningServer[linkRule.server].run(command);
        } catch (e) {
          logger.error(e);
        }
      }
    }
    try {
      await global.runningClient[client].addTorrentTag(torrent.hash, '已链接-' + name.replace(/ /g, '-'));
    } catch (e) {
      logger.error('添加种子标签失败', e);
    }
  }

  _saveSet () {
    const set = {
      id: this.id,
      torrents: this.torrents
    };
    fs.writeFileSync(path.join(__dirname, '../data/watch/set', this.id + '.json'), JSON.stringify(set, null, 2));
  };

  destroy () {
    this.job.stop();
    delete this.job;
    if (global.runningWatch[this.id]) {
      delete global.runningWatch[this.id];
    }
  }
}

module.exports = Watch;
