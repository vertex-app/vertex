const util = require('../libs/util');
const logger = require('../libs/logger');
const path = require('path');

class TorrentMod {
  async list (options) {
    const clientsList = JSON.parse(options.clientList);
    let torrentList = [];
    const clients = global.runningClient;
    for (const clientId of Object.keys(clients)) {
      if (!clientsList.some(item => item === clientId)) continue;
      if (!clients[clientId].maindata) {
        throw new Error('客户端 ' + clients[clientId].alias + ' 未连接或未更新种子列表, 请稍后重试');
      }
      for (const torrent of clients[clientId].maindata.torrents) {
        const _torrent = { ...torrent };
        _torrent.clientAlias = clients[clientId].alias;
        _torrent.client = clientId;
        if (options.searchKey && !options.searchKey.split(' ').every(item => _torrent.name.toLowerCase().indexOf(item.toLowerCase()) !== -1)) continue;
        torrentList.push(_torrent);
      }
    }
    if (options.sortKey) {
      const sortType = options.sortType || 'desc';
      const sortKey = options.sortKey;
      const numberSet = {
        desc: [-1, 1],
        asc: [1, -1]
      };
      torrentList = torrentList.sort((a, b) => {
        if (typeof a[sortKey] === 'string') {
          return (a[sortKey] < b[sortKey] ? numberSet[sortType][1] : numberSet[sortType][0]);
        }
        return sortType === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
      });
    }
    const total = torrentList.length;
    torrentList = torrentList.slice((options.page - 1) * options.length, options.page * options.length);
    const res = await util.getRecords(`select link, hash from torrents where hash in ('${torrentList.map(item => item.hash).join('\',\'')}')`);
    const hashMap = {};
    for (const r of res) {
      hashMap[r.hash] = r.link;
    }
    for (const torrent of torrentList) {
      torrent.link = hashMap[torrent.hash] || false;
    }
    return {
      torrents: torrentList,
      total
    };
  };

  async info (options) {
    const torrentHash = options.hash;
    const clients = global.runningClient;
    for (const clientId of Object.keys(clients)) {
      if (!clients[clientId].maindata) continue;
      for (const torrent of clients[clientId].maindata.torrents) {
        if (torrent.hash !== torrentHash) continue;
        const _torrent = { ...torrent };
        try {
          _torrent.scrapeName = await util.scrapeNameByFile(torrent.name);
        } catch (e) {}
        _torrent.clientAlias = clients[clientId].alias;
        _torrent.client = clientId;
        return _torrent;
      }
    }
    throw new Error('not found');
  }

  async getBulkLinkList (options) {
    const { keyword } = options;
    const clients = global.runningClient;
    const torrents = [];
    const torrentKeys = {};
    for (const clientId of Object.keys(clients)) {
      if (options.client && clientId !== options.client) continue;
      if (!clients[clientId].maindata) continue;
      for (const torrent of clients[clientId].maindata.torrents) {
        if (
          !(
            (torrent.tags && torrent.tags.indexOf(keyword) !== -1) ||
            (torrent.category && torrent.category.indexOf(keyword) !== -1) ||
            (torrent.savePath && torrent.savePath.indexOf(keyword) !== -1)
          )
        ) {
          continue;
        }
        const _torrent = { hash: torrent.hash, name: torrent.name, size: torrent.size, savePath: torrent.savePath };
        _torrent.clientAlias = clients[clientId].alias;
        _torrent.client = clientId;
        const key = `${torrent.savePath}-${torrent.name}-${torrent.size}`;
        if (torrentKeys[key]) {
          continue;
        }
        torrentKeys[key] = 1;
        torrents.push(_torrent);
      }
    }
    return torrents;
  }

  async scrapeName (options) {
    const { name, type } = options;
    return await util.scrapeNameByFile(name, type === 'series' ? 'tv' : type ? 'movie' : '');
  }

  async _linkTorrentFilesNotDryrun ({ hash, client, mediaName, type, linkRule, savePath, libraryPath }) {
    if (!global.linkMapping[hash]) {
      global.linkMapping[hash] = [];
    }
    // 链接有失败标志
    let isError = false;
    const _linkRule = util.listLinkRule().filter(item => item.id === linkRule)[0];
    let size = 1;
    _linkRule.minFileSize.split('*').forEach(i => { size *= +i; });
    _linkRule.minFileSize = size;
    const files = await global.runningClient[client].getFiles(hash);
    if (type === 'series') {
      let newEpisode = 0;
      for (const file of files) {
        const filename = path.basename(file.name);
        if (file.size < _linkRule.minFileSize) continue;
        if (_linkRule.excludeKeys && _linkRule.excludeKeys.split(',').some(item => filename.indexOf(item) !== -1)) continue;
        const seriesName = mediaName.split('/')[0].trim().replace(/ /g, '.').replace(/\.?[第][\d一二三四五六七八九十]+[季部]/, '');
        const prefix = _linkRule.keepSeriesName ? seriesName + '.' : '';
        const suffixKeys = [];
        const reservedKeys = (_linkRule.reservedKeys || '').split(',');
        for (const key of reservedKeys) {
          if (filename.indexOf(key) !== -1) {
            suffixKeys.push(key);
          }
        }
        const suffix = suffixKeys[0] ? '.' + suffixKeys.filter(key => !suffixKeys.some(item => item.indexOf(key) !== -1 && item !== key)).join('.') : '';
        let group = '';
        if (_linkRule.group) {
          group = (filename.match(/[-￡][^-￡]*?$/) || [''])[0].replace(/[-￡]/, '-');
        }
        const fileExt = path.extname(file.name);
        file.name = file.name.replace(/\\/g, '/');
        group = group.replace(fileExt, '');
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
          const seasonSubtitle = mediaName.replace(/ /g, '').match(/第([一二三四五六七八九十])[季部]/);
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
          const seasonSubtitle = mediaName.replace(/ /g, '').match(/第(\d+)[季部]/);
          if (seasonSubtitle) {
            season = +seasonSubtitle[1];
          }
        }
        season = season || 1;
        newEpisode = Math.max(episode, newEpisode);
        episode = 'E' + '0'.repeat(Math.max(0, 2 - ('' + (fakeEpisode || episode)).length)) + (fakeEpisode || episode);
        season = 'S' + '0'.repeat(2 - ('' + season).length) + season;
        const linkFilePath = path.join(_linkRule.linkFilePath, libraryPath, seriesName, season).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, (prefix + season + episode + suffix + group + fileExt).replace(/'/g, '\\\''));
        const targetFile = path.join(savePath.replace(_linkRule.targetPath.split('##')[0], _linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const linkMode = _linkRule.hardlink ? 'f' : 'sf';
        logger.binge(_linkRule, _linkRule.hardlink, linkMode);
        const command = `${_linkRule.umask ? 'umask ' + _linkRule.umask + ' && ' : ''}mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
        logger.binge('手动链接', '执行链接命令', command);
        try {
          if (_linkRule.local) {
            await util.exec(command, { shell: '/bin/bash' });
          } else {
            await global.runningServer[_linkRule.server].run(command);
          }
          global.linkMapping[hash].push((_linkRule.server || '$local$') + '####' + linkFile);
        } catch (e) {
          logger.error(e);
          isError = true;
        }
      }
    } else if (type === 'movie') {
      for (const file of files) {
        if (file.size < _linkRule.minFileSize) continue;
        if (_linkRule.excludeKeys && _linkRule.excludeKeys.split(',').some(item => file.name.indexOf(item) !== -1)) continue;
        const movieName = mediaName.split('/')[0].trim();
        const filename = file.name;
        let year = (filename.match(/[. ](20\d\d)[. ]/) || filename.match(/[. ](19\d\d)[. ]/) || ['', ''])[1];
        if (year) {
          year = '.' + year;
        }
        const suffixKeys = [];
        const reservedKeys = (_linkRule.reservedKeys || '').split(',');
        for (const key of reservedKeys) {
          if (filename.indexOf(key) !== -1) {
            suffixKeys.push(key);
          }
        }
        const suffix = suffixKeys[0] ? '.' + suffixKeys.filter(key => !suffixKeys.some(item => item.indexOf(key) !== -1 && item !== key)).join('.') : '';
        let group = '';
        if (_linkRule.group) {
          group = (filename.match(/[-￡][^-￡]*?$/) || [''])[0].replace(/[-￡]/, '-');
        }
        const fileExt = path.extname(filename);
        file.name = file.name.replace(/\\/g, '/');
        group = group.replace(fileExt, '');
        const linkFilePath = path.join(_linkRule.linkFilePath, libraryPath, `${movieName}${year}`).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, `${movieName}${year}${suffix + group}${fileExt}`.replace(/'/g, '\\\''));
        const targetFile = path.join(savePath.replace(_linkRule.targetPath.split('##')[0], _linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const linkMode = _linkRule.hardlink ? 'f' : 'sf';
        const command = `${_linkRule.umask ? 'umask ' + _linkRule.umask + ' && ' : ''}mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
        logger.binge('手动链接', '执行链接命令', command);
        try {
          if (_linkRule.local) {
            await util.exec(command, { shell: '/bin/bash' });
          } else {
            await global.runningServer[_linkRule.server].run(command);
          }
          global.linkMapping[hash].push((_linkRule.server || '$local$') + '####' + linkFile);
        } catch (e) {
          logger.error(e);
          isError = true;
        }
      }
    }
    try {
      await global.runningClient[client].addTorrentTag(hash, (isError ? '链接遇到错误-' : '已链接-') + mediaName.split('/')[0].replace(/ /g, '-'));
    } catch (e) {
      logger.error('添加种子标签失败', e);
    }
    util.saveLinkMapping();
  }

  async _linkTorrentFilesKeepStruct ({ hash, savePath, client, mediaName = '', libraryPath, linkRule, replaceTopDir, keepTopDir }) {
    if (!global.linkMapping[hash]) {
      global.linkMapping[hash] = [];
    }
    // 链接有失败标志
    let isError = false;
    const _linkRule = util.listLinkRule().filter(item => item.id === linkRule)[0];
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
      const paths = [_linkRule.linkFilePath, libraryPath, mediaName, path.dirname(file._name)];
      const pathsKeepTopDir = [_linkRule.linkFilePath, libraryPath, path.dirname(file._name)];
      const fileBasename = path.basename(filePathname)
        .replace(/'/g, '\\\'');
      const linkFilePath = path.join(...(keepTopDir ? pathsKeepTopDir : paths))
        .replace(/'/g, '\\\'');
      const linkFile = path.join(linkFilePath, fileBasename);
      const targetFile = filePathname
        .replace(/'/g, '\\\'');
      const linkMode = _linkRule.hardlink ? 'f' : 'sf';
      const command = `${_linkRule.umask ? 'umask ' + _linkRule.umask + ' && ' : ''}mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
      logger.binge('手动链接', '执行链接命令', command);
      try {
        if (_linkRule.local) {
          await util.exec(command, { shell: '/bin/bash' });
        } else {
          await global.runningServer[_linkRule.server].run(command);
        }
        global.linkMapping[hash].push((_linkRule.server || '$local$') + '####' + linkFile);
      } catch (e) {
        logger.error(e);
        isError = true;
      }
    }
    try {
      await global.runningClient[client].addTorrentTag(hash, (isError ? '链接遇到错误-' : '已链接-') + mediaName.split('/')[0].replace(/ /g, '-'));
    } catch (e) {
      logger.error('添加种子标签失败', e);
    }
    util.saveLinkMapping();
  }

  async _linkTorrentFiles ({ hash, savePath, client, mediaName, type, libraryPath, linkRule, files: _files }) {
    if (!global.linkMapping[hash]) {
      global.linkMapping[hash] = [];
    }
    // 链接有失败标志
    let isError = false;
    const _linkRule = util.listLinkRule().filter(item => item.id === linkRule)[0];
    const files = await global.runningClient[client].getFiles(hash);
    if (type === 'series') {
      for (const file of files) {
        const _file = _files.filter(item => item.filepath === file.name)[0];
        if (!_file) continue;
        let season = _file.season;
        season = 'S' + '0'.repeat(2 - ('' + season).length) + season;
        const linkFilePath = path.join(_linkRule.linkFilePath, libraryPath, _file.seriesName, season).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, _file.linkFile.replace(/'/g, '\\\''));
        const targetFile = path.join(savePath.replace(_linkRule.targetPath.split('##')[0], _linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const linkMode = _linkRule.hardlink ? 'f' : 'sf';
        const command = `${_linkRule.umask ? 'umask ' + _linkRule.umask + ' && ' : ''}mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
        logger.binge('手动链接', '执行链接命令', command);
        try {
          if (_linkRule.local) {
            await util.exec(command, { shell: '/bin/bash' });
          } else {
            await global.runningServer[_linkRule.server].run(command);
          }
          global.linkMapping[hash].push((_linkRule.server || '$local$') + '####' + linkFile);
        } catch (e) {
          logger.error(e);
          isError = true;
        }
      }
    } else if (type === 'movie') {
      for (const file of files) {
        const _file = _files.filter(item => item.filepath === file.name)[0];
        if (!_file) continue;
        const linkFilePath = path.join(_linkRule.linkFilePath, libraryPath, _file.folderName).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, _file.linkFile.replace(/'/g, '\\\''));
        const targetFile = path.join(savePath.replace(_linkRule.targetPath.split('##')[0], _linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const linkMode = _linkRule.hardlink ? 'f' : 'sf';
        const command = `${_linkRule.umask ? 'umask ' + _linkRule.umask + ' && ' : ''}mkdir -p $'${linkFilePath}' && ln -${linkMode} $'${targetFile}' $'${linkFile}'`;
        logger.binge('手动链接', '执行链接命令', command);
        try {
          if (_linkRule.local) {
            await util.exec(command, { shell: '/bin/bash' });
          } else {
            await global.runningServer[_linkRule.server].run(command);
          }
          global.linkMapping[hash].push((_linkRule.server || '$local$') + '####' + linkFile);
        } catch (e) {
          logger.error(e);
          isError = true;
        }
      }
    }
    try {
      await global.runningClient[client].addTorrentTag(hash, (isError ? '链接遇到错误-' : '已链接-') + mediaName.split('/')[0].replace(/ /g, '-'));
    } catch (e) {
      logger.error('添加种子标签失败', e);
    }
    util.saveLinkMapping();
  }

  async _dryrun ({ hash, client, mediaName, type, linkRule }) {
    const dryrunResult = [];
    const _linkRule = util.listLinkRule().filter(item => item.id === linkRule)[0];
    let size = 1;
    _linkRule.minFileSize.split('*').forEach(i => { size *= +i; });
    _linkRule.minFileSize = size;
    const files = await global.runningClient[client].getFiles(hash);
    if (type === 'series') {
      let newEpisode = 0;
      for (const file of files) {
        const filename = path.basename(file.name);
        if (file.size < _linkRule.minFileSize) continue;
        if (_linkRule.excludeKeys && _linkRule.excludeKeys.split(',').some(item => filename.indexOf(item) !== -1)) continue;
        const seriesName = mediaName.split('/')[0].trim().replace(/ /g, '.').replace(/\.?[第][\d一二三四五六七八九十]+[季部]/, '');
        const prefix = _linkRule.keepSeriesName ? '{SERIESNAME}' + '.' : '';
        const suffixKeys = [];
        const reservedKeys = (_linkRule.reservedKeys || '').split(',');
        for (const key of reservedKeys) {
          if (filename.indexOf(key) !== -1) {
            suffixKeys.push(key);
          }
        }
        const suffix = suffixKeys[0] ? '.' + suffixKeys.filter(key => !suffixKeys.some(item => item.indexOf(key) !== -1 && item !== key)).join('.') : '';
        let group = '';
        if (_linkRule.group) {
          group = (filename.match(/[-￡][^-￡]*?$/) || [''])[0].replace(/[-￡]/, '-');
        }
        const fileExt = path.extname(file.name);
        file.name = file.name.replace(/\\/g, '/');
        group = group.replace(fileExt, '');
        let season = (filename.match(/[. ]S(\d+)/) || [0, null])[1];
        let episode = util.scrapeEpisodeByFilename(filename);
        if (!episode) {
          dryrunResult.push({
            file: file.name,
            episode: -999,
            season: 1,
            seriesName,
            linkFile: prefix + '{SEASON}' + '{EPISODE}' + suffix + group + fileExt
          });
          continue;
        }
        let fakeEpisode = 0;
        const part = (filename.match(/[ .]?[Pp][Aa][Rr][Tt][ .]?0?([abAB12])/));
        if (part?.[1]) {
          fakeEpisode = part?.[1] === 'A' || part?.[1] === '1' ? episode * 2 - 1 : episode * 2;
        }
        if (season === null) {
          const seasonSubtitle = mediaName.replace(/ /g, '').match(/第([一二三四五六七八九十])[季部]/);
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
          const seasonSubtitle = mediaName.replace(/ /g, '').match(/第(\d+)[季部]/);
          if (seasonSubtitle) {
            season = +seasonSubtitle[1];
          }
        }
        season = season || 1;
        newEpisode = Math.max(episode, newEpisode);
        episode = 'E' + '0'.repeat(Math.max(0, 2 - ('' + (fakeEpisode || episode)).length)) + (fakeEpisode || episode);
        season = 'S' + '0'.repeat(2 - ('' + season).length) + season;
        dryrunResult.push({
          file: file.name,
          episode: +episode.replace('E', ''),
          season: +season.replace('S', ''),
          seriesName,
          linkFile: prefix + '{SEASON}' + '{EPISODE}' + suffix + group + fileExt
        });
      }
    } else if (type === 'movie') {
      for (const file of files) {
        if (file.size < _linkRule.minFileSize) continue;
        if (_linkRule.excludeKeys && _linkRule.excludeKeys.split(',').some(item => file.name.indexOf(item) !== -1)) continue;
        const movieName = mediaName.split('/')[0].trim();
        const filename = file.name;
        let year = (filename.match(/[. ](20\d\d)[. ]/) || filename.match(/[. ](19\d\d)[. ]/) || ['', ''])[1];
        if (year) {
          year = '.' + year;
        }
        const suffixKeys = [];
        const reservedKeys = (_linkRule.reservedKeys || '').split(',');
        for (const key of reservedKeys) {
          if (filename.indexOf(key) !== -1) {
            suffixKeys.push(key);
          }
        }
        const suffix = suffixKeys[0] ? '.' + suffixKeys.filter(key => !suffixKeys.some(item => item.indexOf(key) !== -1 && item !== key)).join('.') : '';
        let group = '';
        if (_linkRule.group) {
          group = (filename.match(/[-￡][^-￡]*?$/) || [''])[0].replace(/[-￡]/, '-');
        }
        const fileExt = path.extname(filename);
        file.name = file.name.replace(/\\/g, '/');
        group = group.replace(fileExt, '');
        dryrunResult.push({
          file: filename,
          episode: 1,
          folderName: `${movieName}${year}`,
          linkFile: `${movieName}${year}${suffix + group}${fileExt}`
        });
      }
    }
    return dryrunResult;
  }

  async link (options) {
    if (options.dryrun) {
      const res = await this._dryrun(options);
      return res;
    }
    if (options.direct) {
      await this._linkTorrentFilesNotDryrun(options);
      return '链接成功';
    }
    if (options.keepStruct) {
      await this._linkTorrentFilesKeepStruct(options);
      return '链接成功';
    }
    await this._linkTorrentFiles(options);
    return '链接成功';
  }

  async listHistory (options) {
    const index = options.length * (options.page - 1);
    let where = 'where 1 = 1';
    if (options.type === 'rss') {
      where += ' and record_type IN (1,2,3)';
    } else if (options.type === 'bingewatching') {
      where += ' and record_type IN (4,6,98,99)';
    }
    if (options.rss) {
      if (options.rss === 'deleted') {
        where += ` and rss_id not in ('${util.listRss().map(item => item.id).join('\',\'')}')`;
      } else {
        where += ` and rss_id = '${options.rss}'`;
      }
    }
    if (options.key) {
      where += ` and (name like '%${options.key}%' or record_note like '%${options.key}%')`;
    }
    const params = [options.length, index];
    const torrents = await util.getRecords('select id, rss_id as rssId, name, size, link, record_type as recordType, record_note as recordNote, upload, download, tracker, record_time as recordTime, add_time as addTime, delete_time as deleteTime, hash from torrents ' + where + ' order by id desc limit ? offset ?',
      params);
    const total = (await util.getRecord('select count(*) as total from torrents ' + where)).total;
    return { torrents, total };
  }

  getDelInfo (options) {
    return global.linkMapping[options.hash] || [];
  }

  async deleteTorrent (options) {
    if (!global.runningClient[options.clientId]) {
      throw new Error('客户端 ' + options.clientId + ' 未连接或未更新种子列表, 请稍后重试');
    }
    if (!global.runningClient[options.clientId].maindata) {
      throw new Error('客户端 ' + global.runningClient[options.clientId].alias + ' 未连接或未更新种子列表, 请稍后重试');
    }
    const client = global.runningClient[options.clientId];
    let isError = false;
    try {
      await client.client.deleteTorrent(client.clientUrl, client.cookie, options.hash, true);
    } catch (e) {
      isError = true;
      logger.error('删除种子失败: ', e);
    }
    for (const file of options.files) {
      const { server, filepath } = file;
      try {
        logger.info(global.runningServer[server].server.alias, '执行删除文件命令:', `rm -f $'${filepath}'`);
        if (server === '$local') {
          await util.exec(`rm -f $'${filepath}'`);
        } else {
          await global.runningServer[server].run(`rm -f $'${filepath}'`);
        }
      } catch (e) {
        isError = true;
        logger.error(global.runningServer[server].server.alias, '执行删除文件命令报错:\n');
      }
    }
    if (!isError) {
      delete global.linkMapping[options.hash];
      util.saveLinkMapping();
    }
    return '任务执行完毕, 请检查错误日志是否存在报错信息, 若无报错信息, 才是成功执行';
  }
}

module.exports = TorrentMod;
