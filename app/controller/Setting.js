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
        message: e.message
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
        message: e.message
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
        message: e.message
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
        message: e.message
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
        message: e.message
      });
    }
  };

  async getTorrentMixSetting (req, res) {
    try {
      const r = settingMod.getTorrentMixSetting();
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

  async modifyTorrentMixSetting (req, res) {
    const options = req.body;
    try {
      const r = settingMod.modifyTorrentMixSetting(options);
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
        message: e.message
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
        message: e.message
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
        message: e.message
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
        message: e.message
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
        message: e.message
      });
    }
  }

  async getCss (req, res) {
    const css =
`.el-tabs, .radius-div {
  border-radius: 8px;
  background: rgba(255,255,255, ${global.transparent || 0.3});
  backdrop-filter: blur(${global.blurSize || 4}px);
}`;
    res.set('content-type', 'text/css');
    return res.send(css);
  }
}
module.exports = Setting;
