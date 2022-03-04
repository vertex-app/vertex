const logger = require('../libs/logger');

class WebhookMod {
  async plex (req) {
    logger.info(req);
    return '';
  }
}
module.exports = WebhookMod;
