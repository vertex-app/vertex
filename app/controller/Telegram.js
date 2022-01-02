const logger = require('../libs/logger');
const TelegramMod = require('../model/TelegramMod');

const telegramMod = new TelegramMod();

class Telegram {
  async addBot (req, res) {
    const options = req.body;
    try {
      const r = telegramMod.addBot(options);
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

  async addChannel (req, res) {
    const options = req.body;
    try {
      const r = telegramMod.addChannel(options);
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

  async deleteBot (req, res) {
    const options = req.query;
    try {
      telegramMod.deleteBot(options);
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

  async deleteChannel (req, res) {
    const options = req.query;
    try {
      telegramMod.deleteChannel(options);
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

  async modifyBot (req, res) {
    const options = req.body;
    try {
      telegramMod.modifyBot(options);
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

  async modifyChannel (req, res) {
    const options = req.body;
    try {
      telegramMod.modifyChannel(options);
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

  async listBot (req, res) {
    const options = req.body;
    try {
      const r = telegramMod.listBot(options);
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

  async listChannel (req, res) {
    const options = req.body;
    try {
      const r = telegramMod.listChannel(options);
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
module.exports = Telegram;
