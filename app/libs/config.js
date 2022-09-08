const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const logger = yaml.load(fs.readFileSync(path.join(__dirname, '../config/logger.yaml')));
module.exports = {
  getLoggerConfig () {
    return logger;
  },

  getRedisConfig () {
    return {
      host: '127.0.0.1',
      port: process.env.REDISPORT
    };
  }
};
