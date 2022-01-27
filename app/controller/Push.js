const logger = require('../libs/logger');
const PushMod = require('../model/PushMod');

const pushMod = new PushMod();

class Push {
  async add (req, res) {
    const options = req.body;
    try {
      const r = pushMod.add(options);
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
      const r = pushMod.delete(options);
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
      pushMod.modify(options);
      res.send({
        success: true
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
    const options = req.body;
    try {
      const r = pushMod.list(options);
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
module.exports = Push;
