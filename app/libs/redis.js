const redis = require('redis');

const config = require('./config');
const logger = require('./logger');
const util = require('util');

const client = redis.createClient(config.getRedisConfig());

client.on('error', (err) => {
  logger.error(err);
});

client.on('connect', () => {
  logger.info('Redis connected!');
});

exports.set = util.promisify(client.set).bind(client);
exports.get = util.promisify(client.get).bind(client);
exports.del = util.promisify(client.del).bind(client);
exports.expire = util.promisify(client.expire).bind(client);
exports.scan = util.promisify(client.scan).bind(client);
exports.setWithExpire = async function (k, v, ex) {
  if (!ex && +ex !== ex) {
    throw 'illegal expire';
  }
  await exports.set(k, v);
  await exports.expire(k, ex);
};
exports.deleteAll = async function (str, cursor = '0') {
  const res = await exports.scan(cursor, 'MATCH', str, 'COUNT', '10');
  if (+res[0] === 0 && res[1].length === 0) {
    return logger.info('Redis Delete All', str);
  } else {
    for (const key of res[1]) {
      await exports.del(key);
      logger.debug('redis delete', key);
    }
    return await exports.deleteAll(str, res[0]);
  }
};
