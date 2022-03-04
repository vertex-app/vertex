const logger = require('../libs/logger');
const WebhookMod = require('../model/WebhookMod');

const webhookMod = new WebhookMod();

class Webhook {
  async plex (req, res) {
    try {
      console.log(req.params);
      console.log(global.apiKey);
      if (!global.apiKey || req.params.apiKey !== global.apiKey) {
        throw new Error('鉴权失效');
      }
      const r = await webhookMod.plex(req);
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
}
module.exports = Webhook;
