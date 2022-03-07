const util = require('../libs/util');

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
        const res = await util.getRecord('select link from torrents where hash = ?', [_torrent.hash]);
        _torrent.link = res ? res.link : false;
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

  info (options) {
    const torrentHash = options.hash;
    const clients = global.runningClient;
    for (const clientId of Object.keys(clients)) {
      for (const torrent of clients[clientId].maindata.torrents) {
        if (torrent.hash !== torrentHash) continue;
        const _torrent = { ...torrent };
        _torrent.clientAlias = clients[clientId].alias;
        return _torrent;
      }
    }
    throw new Error('not found');
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
    const parmas = [options.length, index];
    const torrents = await util.getRecords('select rss_id as rssId, name, size, link, record_type as recordType, record_note as recordNote, upload, download, tracker, record_time as recordTime, add_time as addTime, delete_time as deleteTime from torrents ' + where + ' order by id desc limit ? offset ?',
      parmas);
    const total = (await util.getRecord('select count(*) as total from torrents ' + where)).total;
    return { torrents, total };
  }
}

module.exports = TorrentMod;
