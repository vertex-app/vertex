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
      res.set('content-type', 'text/css');
      res.send(r);
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

  async getTorrentPushSetting (req, res) {
    try {
      const r = settingMod.getTorrentPushSetting();
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

  async modifyTorrentPushSetting (req, res) {
    const options = req.body;
    try {
      const r = settingMod.modifyTorrentPushSetting(options);
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
      const file = await settingMod.backupVertex(req.query);
      res.download(file);
    } catch (e) {
      logger.error(e);
      res.send({
        success: true,
        message: e.message
      });
    }
  }

  async restoreVertex (req, res) {
    try {
      const r = await settingMod.restoreVertex(req.files);
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
  }

  async networkTest (req, res) {
    try {
      const r = await settingMod.networkTest(req.body);
      res.send({
        success: true,
        data: r.body
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: true,
        data: e.toString()
      });
    }
  }

  async loginMTeam (req, res) {
    try {
      const r = await settingMod.loginMTeam(req.body);
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

  async getCss (req, res) {
    try {
      const r = settingMod.getCss();
      res.set('content-type', 'text/css');
      res.send(r);
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e.message
      });
    }
  };

  async getTrackerFlowHistory (req, res) {
    try {
      const r = await settingMod.getTrackerFlowHistory();
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
  }

  async getHosts (req, res) {
    try {
      const r = settingMod.getHosts();
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
  }

  async export (req, res) {
    try {
      const r = settingMod.export();
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
  }

  async import (req, res) {
    try {
      const r = settingMod.import();
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
  }

  async save (req, res) {
    try {
      const r = settingMod.save(req.body);
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
  }

  async getProxy (req, res) {
    try {
      const r = settingMod.getProxy();
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
  }

  async saveProxy (req, res) {
    try {
      const r = settingMod.saveProxy(req.body);
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
  }
}
module.exports = Setting;
