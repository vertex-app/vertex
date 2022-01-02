const ServerMod = require('../model/ServerMod');

const serverMod = new ServerMod();

class Server {
  async netSpeed (req, res) {
    const options = req.query;
    try {
      const r = await serverMod.netSpeed(options);
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      res.send({
        success: false,
        message: e
      });
    }
  };

  async cpuUse (req, res) {
    try {
      const r = await serverMod.cpuUse();
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      res.send({
        success: false,
        message: e
      });
    }
  };

  async diskUse (req, res) {
    try {
      const r = await serverMod.diskUse();
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      res.send({
        success: false,
        message: e
      });
    }
  };

  async memoryUse (req, res) {
    try {
      const r = await serverMod.memoryUse();
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      res.send({
        success: false,
        message: e
      });
    }
  };

  async vnstat (req, res) {
    try {
      const r = await serverMod.vnstat();
      res.send({
        success: true,
        data: r
      });
    } catch (e) {
      res.send({
        success: false,
        message: e
      });
    }
  };
}
module.exports = Server;
