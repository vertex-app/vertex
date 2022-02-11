const log4js = require('log4js');
const config = require('./config');

const loggerConfig = config.getLoggerConfig();
const setting = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../data/setting.json'), { encoding: 'utf-8' }));
loggerConfig.categories.default.level = setting.loggerLevel || loggerConfig.categories.default.level;
log4js.configure(loggerConfig);
const logger = log4js.getLogger('console');
logger.use = function (app) {
  app.use(log4js.connectLogger(logger, {
    format: (req, res, format) => format(`[${req.userIp}] [:method] [:url] [${req.headers['user-agent']}]`),
    level: 'trace'
  }));
};
module.exports = logger;
