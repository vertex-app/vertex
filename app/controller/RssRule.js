const logger = require('../libs/logger');
const RssRuleMod = require('../model/RssRuleMod');

const rssRuleMod = new RssRuleMod();

class RssRule {
  async add (req, res) {
    const options = req.body;
    try {
      const r = rssRuleMod.add(options);
      res.send({
        success: true,
        message: r
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e
      });
    }
  };

  async delete (req, res) {
    const options = req.body;
    try {
      const r = rssRuleMod.delete(options);
      res.send({
        success: true,
        message: r
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e
      });
    }
  };

  async modify (req, res) {
    const options = req.body;
    try {
      const r = rssRuleMod.modify(options);
      res.send({
        success: true,
        message: r
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e
      });
    }
  };

  async list (req, res) {
    try {
      const r = rssRuleMod.list();
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
module.exports = RssRule;
