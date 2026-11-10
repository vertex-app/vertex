const crypto = require('crypto');
const manager = require('./manager');
const { CapacityError } = require('./store');

class Cache {
  constructor (stores = manager.stores, maxPending = 128) {
    this.stores = stores;
    this.pending = new Map();
    this.maxPending = maxPending;
  }

  store (key) {
    if (key.startsWith('vertex:select:')) return this.stores.interaction;
    if (/^vertex:(scrape:free:|douban:refresh_cache:)/.test(key)) return this.stores.state;
    return this.stores.cache;
  }

  invalidate (key) {
    const pending = this.pending.get(key);
    if (pending) pending.invalid = true;
  }

  async get (key) { return this.store(key).get(key); }

  async set (key, value) {
    this.invalidate(key);
    return this.store(key).set(key, value);
  }

  async del (key) {
    this.invalidate(key);
    return this.store(key).del(key);
  }

  async take (key) {
    this.invalidate(key);
    return this.store(key).take(key);
  }

  async expire (key, seconds) { return this.store(key).expire(key, seconds * 1000); }

  async setWithExpire (key, value, seconds) {
    if (!Number.isSafeInteger(seconds) || seconds <= 0) throw new TypeError('非法缓存有效期');
    this.invalidate(key);
    return this.store(key).set(key, value, seconds * 1000);
  }

  async getOrLoad (key, loader, seconds) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    if (this.pending.has(key)) return this.pending.get(key).promise;
    if (this.pending.size >= this.maxPending) throw new CapacityError();
    const record = { invalid: false };
    // Schedule the loader after registering the in-flight key.
    record.promise = Promise.resolve().then(loader).then(value => {
      if (!record.invalid) {
        const ttl = typeof seconds === 'function' ? seconds(value) : seconds;
        if (!Number.isSafeInteger(ttl) || ttl <= 0) throw new TypeError('非法缓存有效期');
        this.store(key).set(key, value, ttl * 1000);
      }
      return value;
    }).finally(() => {
      if (this.pending.get(key) === record) this.pending.delete(key);
    });
    this.pending.set(key, record);
    return record.promise;
  }

  key (namespace, ...parts) {
    return `${namespace}:${crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex')}`;
  }
}

module.exports = new Cache();
module.exports.Cache = Cache;
