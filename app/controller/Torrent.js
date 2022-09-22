const logger = require('../libs/logger');
const TorrentMod = require('../model/TorrentMod');

const torrentMod = new TorrentMod();

class Torrent {
  async list (req, res) {
    const options = req.query;
    try {
      const r = await torrentMod.list(options);
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e.message
      });
    }
  };

  async info (req, res) {
    const options = req.query;
    try {
      const r = await torrentMod.info(options);
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e.message
      });
    }
  };

  async getBulkLinkList (req, res) {
    const options = req.query;
    try {
      const r = await torrentMod.getBulkLinkList(options);
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e.message
      });
    }
  };

  async scrapeName (req, res) {
    const options = req.query;
    try {
      const r = await torrentMod.scrapeName(options);
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e.message
      });
    }
  };

  async listHistory (req, res) {
    const options = req.query;
    try {
      const r = await torrentMod.listHistory(options);
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e.message
      });
    }
  };

  async link (req, res) {
    const options = req.body;
    try {
      const r = await torrentMod.link(options);
      if (options.dryrun || options.direct) {
        res.send({
          success: true,
          data: r
        });
      } else {
        res.send({
          success: true,
          message: r
        });
      }
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e.message
      });
    }
  };

  getDelInfo (req, res) {
    const options = req.query;
    try {
      const r = torrentMod.getDelInfo(options);
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      res.send({
        success: false,
        message: e.message
      });
    }
  };

  async deleteTorrent (req, res) {
    const options = req.body;
    try {
      const r = await torrentMod.deleteTorrent(options);
      res.send({
        success: true,
        message: r
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e.message
      });
    }
  };
}
module.exports = Torrent;
