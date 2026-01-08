const logger = require('../libs/logger');
const ScriptMod = require('../model/ScriptMod');

const scriptMod = new ScriptMod();

class Script {
  async add (req, res) {
    const options = req.body;
    try {
      const r = scriptMod.add(options);
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

  async delete (req, res) {
    const options = req.body;
    try {
      const r = scriptMod.delete(options);
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

  async modify (req, res) {
    const options = req.body;
    try {
      const r = scriptMod.modify(options);
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

  async list (req, res) {
    try {
      const r = scriptMod.list();
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

  async run (req, res) {
    const options = req.body;
    try {
      const r = await scriptMod.run(options);
      res.send({
        success: r.success,
        message: r.success ? '执行成功' : (r.error || '执行失败'),
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

  async getLogs (req, res) {
    const { id } = req.query;
    try {
      if (!id) {
        return res.send({
          success: false,
          message: 'Script ID is required'
        });
      }
      const logs = scriptMod.getExecutionLogs(id);
      res.send({
        success: true,
        data: logs
      });
    } catch (e) {
      logger.error(e);
      res.send({
        success: false,
        message: e.message
      });
    }
  };
}
module.exports = Script;
