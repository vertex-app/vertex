const log4js = require('log4js');
const config = require('./config');

log4js.configure(config.getLoggerConfig());
const logger = log4js.getLogger('console');
logger.use = function (app) {
  app.use(log4js.connectLogger(logger, {
    format: (req, res, format) => format(`[${req.headers['x-forwarded-for']}] [:method] [:url] [${req.headers['user-agent']}]`),
    level: 'trace'
  }));
};
module.exports = logger;
