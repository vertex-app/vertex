class TorrentMod {
  list (options) {
    const clientsList = JSON.parse(options.clientList);
    let torrentList = [];
    const clients = global.runningClient;
    for (const clientId of Object.keys(clients)) {
      if (!clientsList.some(item => item === clientId)) continue;
      for (const torrent of clients[clientId].maindata.torrents) {
        const _torrent = { ...torrent };
        _torrent.clientAlias = clients[clientId].clientAlias;
        torrentList.push(_torrent);
      }
    }
    if (options.sortKey) {
      torrentList = torrentList.sort((a, b) => {
        if (typeof a[options.sortKey] === 'string') {
          return (a[options.sortKey] < b[options.sortKey] ? (options.sortType === 'desc' ? 1 : -1) : (options.sortType === 'desc' ? -1 : 1));
        }
        return options.sortType === 'desc' ? a[options.sortKey] - b[options.sortKey] : b[options.sortKey] - a[options.sortKey];
      });
    }
    return {
      torrents: torrentList.slice((options.page - 1) * options.length, options.page * options.length),
      total: torrentList.length
    };
  };
}

module.exports = TorrentMod;
