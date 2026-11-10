const session = require('express-session');
const { AsyncLocalStorage } = require('async_hooks');
const manager = require('./manager');
const { CapacityError } = require('./store');

class MemorySessionStore extends session.Store {
  constructor ({ store = manager.stores.sessions, maxRequests = 1000 } = {}) {
    super();
    this.store = store;
    this.context = new AsyncLocalStorage();
    this.states = new Map();
    this.requests = 0;
    this.maxRequests = maxRequests;
  }

  trackRequest (req, res, next) {
    if (this.requests >= this.maxRequests) return res.status(503).send({ success: false, message: '请求过多，请稍后重试' });
    const context = { reads: new Map(), closed: false };
    this.requests++;
    const finish = () => {
      if (context.closed) return;
      context.closed = true;
      clearTimeout(timer);
      this.requests--;
      for (const [sid, read] of context.reads) {
        read.state.active--;
        if (!read.state.active) this.states.delete(sid);
      }
    };
    // The browser fallback can take 30 seconds; ordinary requests get a bounded lifetime.
    const timer = req.ws ? null : setTimeout(() => { finish(); res.destroy(); }, 180000);
    if (timer) timer.unref();
    if (req.ws) req.ws.once('close', finish);
    res.once('finish', finish);
    res.once('close', finish);
    this.context.run(context, next);
  }

  _read (sid) {
    const context = this.context.getStore();
    if (!context) return null;
    if (context.closed) throw new Error('会话请求已结束');
    if (!context.reads.has(sid)) {
      let state = this.states.get(sid);
      if (!state) {
        state = { version: 0, active: 0, revoked: false };
        this.states.set(sid, state);
      }
      state.active++;
      context.reads.set(sid, { state, version: state.version });
    }
    return context.reads.get(sid);
  }

  _valid (sid) {
    const read = this._read(sid);
    if (read && (read.state.revoked || read.version !== read.state.version)) {
      const error = new Error('会话已变更，请重新请求');
      error.code = 'SESSION_STALE';
      throw error;
    }
    return read;
  }

  _ttl (value) {
    const cookie = value.cookie || {};
    const expires = cookie.expires ? new Date(cookie.expires).getTime() : Date.now() + (cookie.originalMaxAge ?? 30 * 86400000);
    if (!Number.isFinite(expires)) throw new TypeError('非法会话有效期');
    return Math.min(30 * 86400000, expires - Date.now());
  }

  _callback (callback, operation) {
    let result;
    let error;
    try { result = operation(); } catch (err) { error = err; }
    queueMicrotask(() => { if (callback) callback(error || null, result); });
  }

  get (sid, callback) {
    this._callback(callback, () => {
      this._read(sid);
      const value = this.store.get(sid);
      return value === null ? null : JSON.parse(value);
    });
  }

  set (sid, value, callback) {
    this._callback(callback, () => {
      const read = this._valid(sid);
      const ttl = this._ttl(value);
      if (ttl <= 0) {
        this.store.del(sid);
        return;
      }
      if (!this.store.set(sid, JSON.stringify(value), ttl)) throw new CapacityError();
      if (read) {
        read.state.version++;
        read.version = read.state.version;
      }
    });
  }

  touch (sid, value, callback) {
    this._callback(callback, () => {
      this._valid(sid);
      const saved = this.store.get(sid);
      if (saved === null) return;
      const ttl = this._ttl(value);
      if (ttl <= 0) return this.store.del(sid);
      const snapshot = JSON.parse(saved);
      snapshot.cookie = value.cookie;
      this.store.set(sid, JSON.stringify(snapshot), ttl);
    });
  }

  destroy (sid, callback) {
    this._callback(callback, () => {
      this.store.del(sid);
      const state = this.states.get(sid);
      if (state) {
        state.revoked = true;
        state.version++;
      }
    });
  }

  clear (callback) {
    this._callback(callback, () => {
      this.store.clear();
      for (const state of this.states.values()) {
        state.revoked = true;
        state.version++;
      }
    });
  }

  length (callback) {
    this._callback(callback, () => {
      this.store.sweep(this.store.maxEntries + 1);
      return this.store.entries.size;
    });
  }
}

module.exports = MemorySessionStore;
