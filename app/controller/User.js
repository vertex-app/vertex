const logger = require('../libs/logger');
const UserMod = require('../model/UserMod');

const userMod = new UserMod();

class User {
  async login (req, res) {
    const options = req.body;
    try {
      const r = userMod.login(options);
      req.session.user = r;
      req.session.save((err) => {
        if (err) {
          req.session = null;
          res.status(503).send({ success: false, message: '会话保存失败，请稍后重试' });
          return;
        }
        logger.info('登录成功, IP:', req.userIp);
        res.send({ success: true });
      });
    } catch (e) {
      logger.error(e);
      logger.error('登录失败, IP:', req.userIp);
      res.send({
        success: false,
        message: e.message
      });
    }
  };

  logout (req, res) {
    req.session.destroy((err) => {
      if (err) return res.status(503).send({ success: false, message: '退出失败，请稍后重试' });
      res.clearCookie('connect.sid');
      res.send({ success: true });
    });
  };

  async get (req, res) {
    res.send({
      success: true,
      data: await userMod.get()
    });
  }
}
module.exports = User;
