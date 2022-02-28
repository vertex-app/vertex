const Redlock = require('redlock');
const redis = require('redis');

const config = require('./config');
const client = redis.createClient(config.getRedisConfig());

module.exports = new Redlock(
  [client], {
    driftFactor: 0.01,
    retryCount: 100,
    retryDelay: 100,
    retryJitter: 100
  }
);
