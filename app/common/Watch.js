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
    this.linkMode = watch.linkMode;
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
          const forceScrape = this.forceScrape.filter(item => {
            return torrent.name.indexOf(item.keyword) !== -1 ||
            (item.keyword.indexOf('REGEXP:') === 0 && torrent.name.match(new RegExp(item.keyword.replace('REGEXP:', ''))));
          })[0];
          let _name;
          let _season;
          if (forceScrape) {
            _name = forceScrape.name;
            _season = forceScrape.season;
          }
          if (_season === '') {
            _season = false;
          }
          let name;
          let year;
          let type;
          if (forceScrape && forceScrape.keyword.indexOf('REGEXP:') === 0) {
            name = (torrent.name.match(new RegExp(forceScrape.keyword.replace('REGEXP:', ''))))[1];
            type = this.type;
            year = '';
          } else {
            const scrapeRes = await util.scrapeNameByFile(_name || torrent.name, this.type === 'series' ? 'tv' : this.type ? 'movie' : '', true, !!forceScrape);
            name = scrapeRes.name;
            year = scrapeRes.year;
            type = scrapeRes.type;
            type = type === 'tv' ? 'series' : type === 'movie' ? 'movie' : this.type;
            torrent.scrapedName = name;
            torrent.year = year;
            torrent.type = type;
          }
          if (!name) {
            logger.error(`${torrent.name} 识别失败: ${name}.${year}, ${this.linkMode === 'keepStruct-3' ? '保留目录结构执行链接' : ''}`);
            this.ntf.scrapeTorrentFailed(this.alias, torrent.name);
            if (this.linkMode === 'keepStruct-3') {
              await this._linkTorrentFilesKeepStruct(torrent, this.downloader);
            }
          } else {
            this.ntf.scrapeTorrent(this.alias, torrent.name, `${name}.${year} ${type}`);
            logger.watch(`${torrent.name} 识别结果: ${name}.${year || ''} / ${type === 'series' ? '剧集' : '电影'}`);
            if (this.linkMode === 'normal') {
              await this._linkTorrentFiles(torrent, this.downloader, name, _season, year, type);
            } else {
              await this._linkTorrentFilesKeepStruct(torrent, this.downloader, name);
            }
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
          this.torrents[torrent.hash] = { name: torrent.name, size: torrent.size };
          this._saveSet();
        }
      }
    }
  };

  async _linkTorrentFiles (torrent, client, name, _season, year, type) {
    if (!global.linkMapping[torrent.hash]) {
      global.linkMapping[torrent.hash] = [];
    }
    // 链接有失败标志
    let isError = false;
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
        const suffix = suffixKeys[0] ? '.' + suffixKeys.filter(key => !suffixKeys.some(item => item.indexOf(key) !== -1 && item !== key)).join('.') : '';
        let group = '';
        if (linkRule.group) {
          group = (filename.match(/[-￡][^-￡]*?$/) || [''])[0].replace(/[-￡]/, '-');
        }
        const fileExt = path.extname(file.name);
        file.name = file.name.replace(/\\/g, '/');
        group = group.replace(fileExt, '');
        const linkFilePath = path.join(linkRule.linkFilePath, this.libraryPath.split(':')[1], `${seriesName}(${year})`, season).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, prefix + season + episode + suffix + group + fileExt).replace(/'/g, '\\\'');
        const targetFile = path.join(torrent.savePath.replace(linkRule.targetPath.split('##')[0], linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const linkMode = linkRule.hardlink ? 'f' : 'sf';
        const command = `${linkRule.umask ? 'umask ' + linkRule.umask + ' && ' : ''}mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
        logger.watch(this.alias, '执行链接命令', command);
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
    } else if (type === 'movie') {
      for (const file of files) {
        if (file.size < linkRule.minFileSize) continue;
        if (linkRule.excludeKeys && linkRule.excludeKeys.split(',').some(item => file.name.indexOf(item) !== -1)) continue;
        const movieName = name;
        const filename = file.name;
        let _year = year || (filename.match(/[. ](20\d\d)[. ]/) || filename.match(/[. ](19\d\d)[. ]/) || ['', ''])[1];
        if (_year) {
          _year = `(${_year})`;
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
        const linkFilePath = path.join(linkRule.linkFilePath, this.libraryPath.split(':')[0], `${movieName}${_year}`).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, `${movieName}${_year}${suffix + group}${fileExt}`.replace(/'/g, '\\\''));
        const targetFile = path.join(torrent.savePath.replace(linkRule.targetPath.split('##')[0], linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const linkMode = linkRule.hardlink ? 'f' : 'sf';
        const command = `${linkRule.umask ? 'umask ' + linkRule.umask + ' && ' : ''}mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
        logger.watch(this.alias, '执行链接命令', command);
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
      await global.runningClient[client].addTorrentTag(torrent.hash, (isError ? '链接遇到错误-' : '已链接-') + name.replace(/ /g, '-'));
    } catch (e) {
      logger.error('添加种子标签失败', e);
    }
    util.saveLinkMapping();
  }

  async _linkTorrentFilesKeepStruct (torrent, client, name) {
    if (!global.linkMapping[torrent.hash]) {
      global.linkMapping[torrent.hash] = [];
    }
    // 链接有失败标志
    let isError = false;
    const replaceTopDir = this.linkMode === 'keepStruct-2';
    const keepTopDir = this.linkMode === 'keepStruct-3';
    const hash = torrent.hash;
    const savePath = torrent.savePath;
    const libraryPath = this.libraryPath.split(':')[this.type === 'movie' ? 0 : 1];
    const _linkRule = util.listLinkRule().filter(item => item.id === this.linkRule)[0];
    const files = await global.runningClient[client].getFiles(hash);
    const first = files[0].name;
    let topDir = path.dirname(first);
    const hasDir = topDir !== '.';
    if (hasDir) {
      let d = topDir;
      while (d !== '.') {
        topDir = d;
        d = path.dirname(d);
      }
    }
    const hasTopDir = files.every(item => item.name.indexOf(topDir) === 0);
    if (!hasTopDir) {
      topDir = false;
    }
    for (const file of files) {
      const filename = path.basename(file.name);
      if (file.size < _linkRule.minFileSize) continue;
      if (_linkRule.excludeKeys && _linkRule.excludeKeys.split(',').some(item => filename.indexOf(item) !== -1)) continue;
      const filePathname = path.join(savePath.replace(..._linkRule.targetPath.split('##')), file.name);
      if (replaceTopDir) {
        file._name = file.name.replace(topDir, '');
      } else {
        file._name = file.name;
      }
      const paths = [_linkRule.linkFilePath, libraryPath, name, path.dirname(file._name)];
      const pathsKeepTopDir = [_linkRule.linkFilePath, libraryPath, path.dirname(file._name)];
      const fileBasename = path.basename(filePathname);
      const linkFilePath = path.join(...(keepTopDir ? pathsKeepTopDir : paths)).replace(/'/g, '\\\'');
      const linkFile = path.join(linkFilePath, fileBasename.replace(/'/g, '\\\''));
      const targetFile = filePathname.replace(/'/g, '\\\'');
      const linkMode = _linkRule.hardlink ? 'f' : 'sf';
      const command = `${_linkRule.umask ? 'umask ' + _linkRule.umask + ' && ' : ''}mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
      logger.binge('手动链接', '执行链接命令', command);
      try {
        if (_linkRule.local) {
          await util.exec(command, { shell: '/bin/bash' });
        } else {
          await global.runningServer[_linkRule.server].run(command);
        }
        global.linkMapping[torrent.hash].push((_linkRule.server || '$local$') + '####' + linkFile);
      } catch (e) {
        logger.error(e);
        isError = true;
      }
    }
    try {
      await global.runningClient[client].addTorrentTag(hash, (isError ? '链接遇到错误-' : '已链接-') + name.split('/')[0].replace(/ /g, '-'));
    } catch (e) {
      logger.error('添加种子标签失败', e);
    }
    util.saveLinkMapping();
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

  delHistory (hash) {
    delete this.torrents[hash];
    this._saveSet();
  };
}

module.exports = Watch;
