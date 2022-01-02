const logger = require('../libs/logger');
const ClientMod = require('../model/ClientMod');

const clientMod = new ClientMod();

class Client {
  async add (req, res) {
    const options = req.body;
    try {
      const r = clientMod.add(options);
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
    const options = req.query;
    try {
      clientMod.delete(options);
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

  async modify (req, res) {
    const options = req.body;
    try {
      const r = clientMod.modify(options);
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
      const r = clientMod.list();
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
module.exports = Client;
