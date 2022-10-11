const log4js = require('log4js');
const config = require('./config');
let redis = null;

const loggerConfig = config.getLoggerConfig();
const setting = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../data/setting.json'), { encoding: 'utf-8' }));
loggerConfig.categories.default.level = setting.loggerLevel || loggerConfig.categories.default.level;
loggerConfig.appenders.error.layout.tokens = {
  redis: (logEvent) => {
    const f = async () => {
      if (!redis) redis = require('./redis');
      const errorList = JSON.parse((await redis.get('vertex:error:list') || '[]'));
      delete logEvent.data.cert;
      errorList.push(logEvent.data);
      while (errorList.length > 5) {
        errorList.shift();
      }
      try {
        redis.set('vertex:error:list', JSON.stringify(errorList));
      } catch (e) {};
    };
    f();
    return '';
  }
};
log4js.configure(loggerConfig);
const logger = log4js.getLogger('console');
logger.use = function (app) {
  app.use(log4js.connectLogger(logger, {
    format: (req, res, format) => format(`[${req.userIp}] [:method] [:url] [${req.headers['user-agent']}]`),
    level: 'trace'
  }));
};
module.exports = logger;
