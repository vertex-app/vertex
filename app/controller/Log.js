const logger = require('../libs/logger');
const LogMod = require('../model/LogMod');

const logMod = new LogMod();

class Log {
  async get (req, res) {
    const options = req.query;
    try {
      const r = logMod.get(options);
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

  async clear (req, res) {
    try {
      const r = logMod.clear();
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
module.exports = Log;
