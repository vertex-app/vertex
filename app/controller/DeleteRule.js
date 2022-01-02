const logger = require('../libs/logger');
const DeleteRuleMod = require('../model/DeleteRuleMod');

const deleteRuleMod = new DeleteRuleMod();

class DeleteRule {
  async add (req, res) {
    const options = req.body;
    try {
      const r = deleteRuleMod.add(options);
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
      deleteRuleMod.delete(options);
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
      const r = deleteRuleMod.modify(options);
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
      const r = deleteRuleMod.list();
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
module.exports = DeleteRule;
