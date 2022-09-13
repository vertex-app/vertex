const log4js = require('log4js');
const config = require('./config');
let redis = null;

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
const _error = logger.error;
logger.error = async (...args) => {
  _error.call(logger, ...args);
  if (!redis) redis = require('./redis');
  const errorList = JSON.parse((await redis.get('vertex:error:list') || '[]'));
  errorList.push(args);
  if (errorList.length > 5) {
    errorList.pop();
  }
  redis.set('vertex:error:list', JSON.stringify(errorList));
};
module.exports = logger;
