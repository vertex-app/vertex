const { Store } = require('./store');
const { isMainThread } = require('worker_threads');
const cluster = require('cluster');

if (!isMainThread || cluster.isWorker) throw new Error('内存状态管理仅支持单 Node.js 主进程');

const MiB = 1024 * 1024;
const setting = (name, fallback) => {
  const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isSafeInteger(value) || value <= 0 || value > 4096) throw new TypeError(`非法内存配置: ${name}`);
  return value * MiB;
};
const profiles = {
  cache: { maxBytes: 32 * MiB, maxEntries: 30000 },
  sessions: { maxBytes: 16 * MiB, maxEntries: 2000, maxValueBytes: 64 * 1024, evict: false },
  state: { maxBytes: 8 * MiB, maxEntries: 15000, evict: false },
  interaction: { maxBytes: 4 * MiB, maxEntries: 1000, evict: false }
};

class Manager {
  constructor () {
    this.budget = { used: 0, max: setting('VERTEX_MEMORY_TOTAL_MB', 64) };
    this.stores = {};
    for (const [name, profile] of Object.entries(profiles)) {
      this.stores[name] = new Store({
        ...profile,
        maxBytes: setting(`VERTEX_MEMORY_${name.toUpperCase()}_MB`, profile.maxBytes / MiB),
        budget: this.budget
      });
    }
    this.timer = setInterval(() => {
      for (const store of Object.values(this.stores)) store.sweep();
    }, 1000);
    this.timer.unref();
  }

  close () {
    clearInterval(this.timer);
    for (const store of Object.values(this.stores)) store.clear();
  }

  stats () {
    return Object.fromEntries(Object.entries(this.stores).map(([name, store]) => [name, store.stats()]));
  }
}

module.exports = new Manager();
module.exports.Manager = Manager;
