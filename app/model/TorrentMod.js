const logger = require('../libs/logger');
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
        _torrent.clientAlias = clients[clientId].clientAlias;
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
        _torrent.clientAlias = clients[clientId].clientAlias;
        return _torrent;
      }
    }
    throw new Error('not found');
  }

  async listHistory (options) {
    const index = options.length * (options.page - 1);
    const torrents = await util.getRecords('select rss_name as rssName, name, size, insert_type as type, uploaded, downloaded from torrents order by id desc limit ? offset ?',
      [options.length, index]);
    return { torrents };
  }
}

module.exports = TorrentMod;
