const logger = require('../libs/logger');
const SettingMod = require('../model/SettingMod');

const settingMod = new SettingMod();

class Setting {
  async get (req, res) {
    try {
      const r = settingMod.get();
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

  async getBackground (req, res) {
    try {
      const r = settingMod.getBackground();
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

  async modify (req, res) {
    const options = req.body;
    try {
      const r = settingMod.modify(options);
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
}
module.exports = Setting;
