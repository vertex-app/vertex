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
      for (const torrent of clients[clientId].maindata.torrents) {
        const _torrent = { ...torrent };
        _torrent.clientAlias = clients[clientId].alias;
        _torrent.client = clientId;
        const res = await util.getRecord('select link from torrents where hash = ?', [_torrent.hash]);
        _torrent.link = res ? res.link : false;
        if (options.searchKey && !options.searchKey.split(' ').every(item => _torrent.name.indexOf(item) !== -1)) continue;
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
    return {
      torrents: torrentList.slice((options.page - 1) * options.length, options.page * options.length),
      total: torrentList.length
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

  async scrapeName (options) {
    const { keyword, type } = options;
    const clients = global.runningClient;
    const torrents = [];
    for (const clientId of Object.keys(clients)) {
      if (!clients[clientId].maindata) continue;
      for (const torrent of clients[clientId].maindata.torrents) {
        if (
          !(
            (torrent.tags && torrent.tags.indexOf(keyword) !== -1) ||
            (torrent.category && torrent.category.indexOf(keyword) !== -1)
          )
        ) {
          continue;
        }
        const _torrent = { ...torrent };
        try {
          _torrent.scrapeName = await util.scrapeNameByFile(torrent.name, type === 'series' ? 'tv' : 'movie');
        } catch (e) { logger.info(e); }
        _torrent.clientAlias = clients[clientId].alias;
        _torrent.client = clientId;
        torrents.push(_torrent);
      }
    }
    return torrents;
  }

  async _linkTorrentFiles ({ hash, savePath, client, mediaName, type, libraryPath, linkRule, dryrun = false }) {
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
        let season = (filename.match(/[. ]S(\d+)/) || [0, null])[1];
        let episode = +(filename.match(/[Ee][Pp]?(\d+)[. ]/) || [])[1];
        // 适配奇奇怪怪的命名
        if (!episode) {
          episode = +(filename.match(/\[(\d+)[Vv]*\d*\]/) || [])[1];
        }
        if (!episode) {
          episode = +(filename.match(/第(\d+)[话話集]/) || [])[1];
        }
        if (!episode) {
          const episodes = filename.match(/[^(mp)]\d+[^KkFfPpi]/g)
            ?.map(item => +item)
            .filter(item => [0, 480, 720, 1080, 576, 2160].indexOf(item) === -1) || [];
          if (episodes.length === 1) {
            episode = episodes[0];
          }
        }
        if (!episode) {
          continue;
        }
        let fakeEpisode = 0;
        const part = (filename.match(/[ .][Pp][Aa][Rr][Tt][ .]?([abAB12])/));
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
        const prefix = _linkRule.keepSeriesName ? seriesName + '.' : '';
        let suffix = '';
        _linkRule.reservedKeys = _linkRule.reservedKeys || '';
        for (const key of _linkRule.reservedKeys.split(',')) {
          if (filename.indexOf(key) !== -1 && suffix.indexOf(key) === -1) {
            suffix += '.' + key;
          }
        }
        const fileExt = path.extname(file.name);
        const linkFilePath = path.join(_linkRule.linkFilePath, libraryPath, seriesName, season).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, prefix + season + episode + suffix + fileExt).replace(/'/g, '\\\'');
        const targetFile = path.join(savePath.replace(_linkRule.targetPath.split('##')[0], _linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const command = `mkdir -p $'${linkFilePath}' && ln -sf $'${targetFile}' $'${linkFile}'`;
        if (dryrun) {
          dryrunResult.push({
            file: filename,
            episode,
            season,
            seriesName,
            linkFile: prefix + season + episode + suffix + fileExt
          });
          continue;
        }
        logger.binge('手动软链接', '执行软连接命令', command);
        try {
          await global.runningServer[_linkRule.server].run(command);
        } catch (e) {
          logger.error(e);
        }
      }
    } else if (type === 'movie') {
      for (const file of files) {
        if (file.size < _linkRule.minFileSize) continue;
        const movieName = mediaName.split('/')[0].trim();
        const year = (file.name.match(/[. ](20\d\d)[. ]/) || file.name.match(/[. ](19\d\d)[. ]/) || ['', ''])[1];
        const fileExt = path.extname(file.name);
        const linkFilePath = path.join(_linkRule.linkFilePath, libraryPath, `${movieName}.${year}`).replace(/'/g, '\\\'');
        const linkFile = path.join(linkFilePath, `${movieName}.${year}${fileExt}`).replace(/'/g, '\\\'');
        if (dryrun) {
          dryrunResult.push({
            file: path.basename(file.name),
            folderName: `${movieName}.${year}`,
            linkFile: `${movieName}.${year}${fileExt}`
          });
          continue;
        }
        const targetFile = path.join(savePath.replace(_linkRule.targetPath.split('##')[0], _linkRule.targetPath.split('##')[1]), file.name).replace(/'/g, '\\\'');
        const command = `mkdir -p $'${linkFilePath}' && ln -sf $'${targetFile}' $'${linkFile}'`;
        logger.binge('手动软链接', '执行软连接命令', command);
        await global.runningServer[_linkRule.server].run(command);
      }
    }
    return dryrunResult;
  }

  async link (options) {
    const res = await this._linkTorrentFiles(options);
    return options.dryrun ? res : '软链接成功';
  }

  async listHistory (options) {
    const index = options.length * (options.page - 1);
    let where = 'where 1 = 1';
    if (options.rss && options.rss === 'deleted') {
      where += ` and rss_id NOT IN ('${util.listRss().map(item => item.id).join('\', \'')}')`;
    } else if (options.rss) {
      where += ` and rss_id = '${options.rss}'`;
    }
    if (options.key) {
      where += ` and name like '%${options.key}%'`;
    }
    if (options.type) {
      where += ` and record_type like '%${options.type}%'`;
    }
    const params = [options.length, index];
    const torrents = await util.getRecords('select rss_id as rssId, name, size, link, record_type as recordType, record_note as recordNote, upload, download, tracker, record_time as recordTime, add_time as addTime, delete_time as deleteTime from torrents ' + where + ' order by id desc limit ? offset ?',
      params);
    const total = (await util.getRecord('select count(*) as total from torrents ' + where)).total;
    return { torrents, total };
  }
}

module.exports = TorrentMod;
