const { performance } = require('perf_hooks');

class CapacityError extends Error {
  constructor () {
    super('内存状态容量已满，请稍后重试');
    this.code = 'MEMORY_CAPACITY';
  }
}

class Store {
  constructor ({ maxBytes, maxEntries, maxValueBytes = 2 * 1024 * 1024, evict = true, clock = () => performance.now(), budget } = {}) {
    for (const value of [maxBytes, maxEntries, maxValueBytes]) {
      if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError('非法内存容量');
    }
    this.maxBytes = maxBytes;
    this.maxEntries = maxEntries;
    this.maxValueBytes = maxValueBytes;
    this.evict = evict;
    this.clock = clock;
    this.budget = budget || { used: 0, max: maxBytes };
    this.entries = new Map();
    this.bytes = 0;
    this.counters = { hits: 0, misses: 0, expired: 0, evicted: 0, rejected: 0 };
  }

  _key (key) {
    if (typeof key !== 'string' || Buffer.byteLength(key) > 8192) throw new TypeError('非法缓存键');
  }

  _reject () {
    this.counters.rejected++;
    if (!this.evict) throw new CapacityError();
    return false;
  }

  _entry (key) {
    const entry = this.entries.get(key);
    if (entry && entry.expires <= this.clock()) {
      this.del(key);
      this.counters.expired++;
      return null;
    }
    return entry || null;
  }

  get (key) {
    this._key(key);
    const entry = this._entry(key);
    if (!entry) {
      this.counters.misses++;
      return null;
    }
    this.counters.hits++;
    if (this.evict) {
      this.entries.delete(key);
      this.entries.set(key, entry);
    }
    return entry.value;
  }

  set (key, value, ttlMs) {
    this._key(key);
    if (ttlMs !== undefined && (!Number.isFinite(ttlMs) || ttlMs <= 0)) throw new TypeError('非法过期时间');
    value = Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
    const valueBytes = Buffer.byteLength(value);
    const size = Buffer.byteLength(key) + valueBytes + 128;
    if (valueBytes > this.maxValueBytes || size > this.maxBytes) return this._reject();
    const previous = this._entry(key);
    const delta = size - (previous ? previous.size : 0);
    const full = () => this.bytes + delta > this.maxBytes ||
      this.budget.used + delta > this.budget.max ||
      (!previous && this.entries.size >= this.maxEntries);
    if (full()) this.sweep(256);
    // A sweep may remove the previous record only if it expired during this call.
    if (previous && !this.entries.has(key)) return this.set(key, value, ttlMs);
    if (this.evict) {
      for (const candidate of this.entries.keys()) {
        if (!full()) break;
        if (candidate !== key) {
          this.del(candidate);
          this.counters.evicted++;
        }
      }
    }
    if (full()) return this._reject();
    this.entries.delete(key);
    this.entries.set(key, { value, size, expires: ttlMs === undefined ? Infinity : this.clock() + ttlMs });
    this.bytes += delta;
    this.budget.used += delta;
    return true;
  }

  del (key) {
    const entry = this.entries.get(key);
    if (!entry) return 0;
    this.entries.delete(key);
    this.bytes -= entry.size;
    this.budget.used -= entry.size;
    return 1;
  }

  expire (key, ttlMs) {
    if (!Number.isFinite(ttlMs)) throw new TypeError('非法过期时间');
    const entry = this._entry(key);
    if (!entry) return 0;
    if (ttlMs <= 0) return this.del(key);
    entry.expires = this.clock() + ttlMs;
    return 1;
  }

  take (key) {
    const value = this.get(key);
    this.del(key);
    return value;
  }

  sweep (limit = 256) {
    this.sweeps = (this.sweeps || 0) + 1;
    if (this.sweeps > Math.ceil(this.maxEntries / limit) + 1) {
      this.cursor = null;
      this.sweeps = 0;
    }
    if (!this.cursor) this.cursor = this.entries.keys();
    for (let i = 0; i < limit; i++) {
      const item = this.cursor.next();
      if (item.done) {
        this.cursor = null;
        break;
      }
      this._entry(item.value);
    }
  }

  clear () {
    this.budget.used -= this.bytes;
    this.bytes = 0;
    this.entries.clear();
    this.cursor = null;
  }

  stats () {
    return { entries: this.entries.size, bytes: this.bytes, ...this.counters };
  }
}

module.exports = { Store, CapacityError };
