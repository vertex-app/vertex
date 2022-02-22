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

  async getTorrentHistorySetting (req, res) {
    try {
      const r = settingMod.getTorrentHistorySetting();
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

  async modifyTorrentHistorySetting (req, res) {
    const options = req.body;
    try {
      const r = settingMod.modifyTorrentHistorySetting(options);
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

  async getSitePushSetting (req, res) {
    try {
      const r = settingMod.getSitePushSetting();
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

  async modifySitePushSetting (req, res) {
    const options = req.body;
    try {
      const r = settingMod.modifySitePushSetting(options);
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

  async getRunInfo (req, res) {
    try {
      const r = await settingMod.getRunInfo();
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

  async backupVertex (req, res) {
    try {
      const file = await settingMod.backupVertex();
      res.download(file);
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e
      });
    }
  }

  async restoreVertex (req, res) {
    try {
      const r = await settingMod.restoreVertex(req.files);
      res.send({
        success: false,
        message: r
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e
      });
    }
  }
}
module.exports = Setting;
