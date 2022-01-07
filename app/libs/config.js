const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const config = yaml.load(fs.readFileSync(path.join(__dirname, '../config/config.yaml')));
const logger = yaml.load(fs.readFileSync(path.join(__dirname, '../config/logger.yaml')));
module.exports = {
  getLoggerConfig () {
    return logger;
  },

  getRedisConfig () {
    return config.redis;
  },

  getAuthConfig () {
    return config.auth;
  }
};
