const ServerMod = require('../model/ServerMod');

const serverMod = new ServerMod();

class Server {
  async add (req, res) {
    const options = req.body;
    try {
      const r = serverMod.add(options);
      res.send({
        success: true,
        message: r
      });
    } catch (e) {
      res.send({
        success: false,
        message: e
      });
    }
  };

  async delete (req, res) {
    const options = req.body;
    try {
      const r = serverMod.delete(options);
      res.send({
        success: true,
        message: r
      });
    } catch (e) {
      res.send({
        success: false,
        message: e
      });
    }
  };

  async modify (req, res) {
    const options = req.body;
    try {
      const r = serverMod.modify(options);
      res.send({
        success: true,
        message: r
      });
    } catch (e) {
      res.send({
        success: false,
        message: e
      });
    }
  };

  async list (req, res) {
    try {
      const r = serverMod.list();
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

  async netSpeed (req, res) {
    try {
      const r = await serverMod.netSpeed();
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
    const id = req.query.id;
    try {
      const r = await serverMod.vnstat(id);
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
