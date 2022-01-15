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
        message: e
      });
    }
  };
}
module.exports = Log;
