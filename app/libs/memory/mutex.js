class Mutex {
  constructor (maxWaiters = 64, maxResources = 128) {
    this.resources = new Map();
    this.maxWaiters = maxWaiters;
    this.maxResources = maxResources;
    this.closed = false;
  }

  acquire (resource, { waitTimeoutMs = 120000, signal } = {}) {
    if (!Number.isFinite(waitTimeoutMs) || waitTimeoutMs <= 0) return Promise.reject(new TypeError('非法锁等待时间'));
    if (this.closed || signal?.aborted) return Promise.reject(new Error('任务已取消'));
    let state = this.resources.get(resource);
    if (!state) {
      if (this.resources.size >= this.maxResources) return Promise.reject(new Error('并发资源已满'));
      state = { owner: null, waiters: [] };
      this.resources.set(resource, state);
    }
    const grant = () => {
      const owner = Symbol(resource);
      state.owner = owner;
      return () => {
        if (state.owner !== owner) return;
        state.owner = null;
        const next = state.waiters.shift();
        if (next) next.grant();
        else this.resources.delete(resource);
      };
    };
    if (!state.owner) return Promise.resolve(grant());
    if (state.waiters.length >= this.maxWaiters) return Promise.reject(new Error('任务等待队列已满'));
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(waiter.timer);
        if (signal) signal.removeEventListener('abort', waiter.abort);
      };
      const cancel = () => {
        const index = state.waiters.indexOf(waiter);
        if (index === -1) return;
        state.waiters.splice(index, 1);
        cleanup();
        reject(new Error('任务等待超时或已取消'));
      };
      const waiter = {
        grant: () => { cleanup(); resolve(grant()); },
        reject: () => { cleanup(); reject(new Error('任务已关闭')); },
        abort: cancel,
        timer: setTimeout(cancel, waitTimeoutMs)
      };
      state.waiters.push(waiter);
      if (signal) signal.addEventListener('abort', cancel, { once: true });
    });
  }

  async runExclusive (resource, task, options) {
    const release = await this.acquire(resource, options);
    try { return await task(); } finally { release(); }
  }

  close () {
    this.closed = true;
    for (const state of this.resources.values()) {
      for (const waiter of state.waiters.splice(0)) waiter.reject();
    }
  }
}

module.exports = Mutex;
