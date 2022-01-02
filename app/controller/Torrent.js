const logger = require('../libs/logger');
const TorrentMod = require('../model/TorrentMod');

const torrentMod = new TorrentMod();

class Torrent {
  async list (req, res) {
    try {
      const r = torrentMod.list();
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e
      });
    }
  };
}
module.exports = Torrent;
