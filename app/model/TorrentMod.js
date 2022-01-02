class TorrentMod {
  list () {
    const torrentList = [];
    const clients = global.runningClient;
    for (const clientId of Object.keys(clients)) {
      for (const torrent of clients[clientId].maindata.torrents) {
        const _torrent = { ...torrent };
        _torrent.clientAlias = clients[clientId].clientAlias;
        torrentList.push(_torrent);
      }
    }
    return torrentList;
  };
}

module.exports = TorrentMod;
