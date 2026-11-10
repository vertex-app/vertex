const test = require('node:test');
const assert = require('node:assert/strict');
const { Store } = require('../app/libs/memory/store');
const { Cache } = require('../app/libs/memory/cache');
const { ErrorBuffer } = require('../app/libs/memory/error-buffer');
const Mutex = require('../app/libs/memory/mutex');
const BrowserManager = require('../app/libs/memory/browser');

const makeStore = (options = {}) => new Store({ maxBytes: 1024, maxEntries: 3, maxValueBytes: 512, ...options });
const tick = () => new Promise(resolve => setImmediate(resolve));

test('TTL boundaries, numeric compatibility, overwrite and byte accounting', () => {
  let now = 0;
  const store = makeStore({ clock: () => now });
  store.set('number', 1, 100);
  assert.equal(store.get('number'), '1');
  now = 99;
  assert.equal(store.get('number'), '1');
  now = 100;
  assert.equal(store.get('number'), null);
  assert.equal(store.bytes, 0);
  store.set('a', 'old', 10);
  store.set('a', 'new');
  now += 1000;
  assert.equal(store.get('a'), 'new');
  store.expire('a', 1);
  now++;
  assert.equal(store.take('a'), null);
  assert.equal(store.budget.used, 0);
  assert.equal(store.expire('missing', 10), 0);
  assert.throws(() => store.set('bad', 'x', NaN));
  assert.throws(() => store.expire('bad', Infinity));
});

test('cache LRU pressure never silently evicts protected state', () => {
  const cache = makeStore({ maxEntries: 2 });
  cache.set('a', 'a'); cache.set('b', 'b'); cache.get('a'); cache.set('c', 'c');
  assert.equal(cache.get('b'), null);
  assert.equal(cache.get('a'), 'a');
  assert.equal(cache.set('large', 'x'.repeat(513)), false);
  const state = makeStore({ maxEntries: 1, evict: false });
  state.set('important', 'yes');
  assert.throws(() => state.set('other', 'no'), { code: 'MEMORY_CAPACITY' });
  assert.equal(state.get('important'), 'yes');
  assert.throws(() => state.set('important', 'x'.repeat(513)), { code: 'MEMORY_CAPACITY' });
  assert.equal(state.take('important'), 'yes');
  assert.equal(state.take('important'), null);
});

test('single flight retries after rejection and cannot revive invalidated values', async () => {
  const cache = new Cache({ cache: makeStore(), state: makeStore(), interaction: makeStore() }, 2);
  let loads = 0;
  let complete;
  const load = () => { loads++; return new Promise(resolve => { complete = resolve; }); };
  const first = cache.getOrLoad('key', load, 30);
  const second = cache.getOrLoad('key', load, 30);
  await tick();
  assert.equal(loads, 1);
  await cache.del('key');
  complete('old');
  assert.deepEqual(await Promise.all([first, second]), ['old', 'old']);
  assert.equal(await cache.get('key'), null);
  await assert.rejects(cache.getOrLoad('failure', () => { throw Error('network'); }, 30), /network/);
  assert.equal(await cache.getOrLoad('failure', () => 'recovered', 30), 'recovered');
  assert.equal(cache.pending.size, 0);
  assert.notEqual(cache.key('user', 'url', 'cookie1'), cache.key('user', 'url', 'cookie2'));
});

test('error buffer has bounded snapshots and atomic drain', () => {
  const errors = new ErrorBuffer(2, 1024);
  errors.push(['one']); errors.push(['two']); errors.push({ cookie: 'secret', value: 'three' });
  const snapshot = errors.drain();
  assert.equal(snapshot.length, 2);
  assert.equal(snapshot[1].cookie, '[已隐藏]');
  errors.push(['new']);
  assert.deepEqual(errors.drain(), [['new']]);
  assert.deepEqual(errors.drain(), []);
  const cyclic = {}; cyclic.cyclic = cyclic;
  errors.push(cyclic);
  assert.equal(errors.drain()[0].cyclic, '[循环引用]');
});

test('mutex is FIFO, cancellable, bounded and releases after exceptions', async () => {
  const mutex = new Mutex(2);
  const release = await mutex.acquire('resource');
  const order = [];
  const first = mutex.runExclusive('resource', async () => { order.push(1); throw Error('expected'); });
  const checkFirst = assert.rejects(first, /expected/);
  const controller = new AbortController();
  const cancelled = mutex.acquire('resource', { signal: controller.signal });
  const checkCancelled = assert.rejects(cancelled, /取消/);
  await assert.rejects(mutex.acquire('resource'), /已满/);
  controller.abort();
  await checkCancelled;
  release(); release();
  await checkFirst;
  await mutex.runExclusive('resource', () => order.push(2));
  assert.deepEqual(order, [1, 2]);
  assert.equal(mutex.resources.size, 0);
  const hold = await mutex.acquire('timeout');
  await assert.rejects(mutex.acquire('timeout', { waitTimeoutMs: 5 }), /超时/);
  hold();
});

test('browser initializes once, isolates contexts and closes after the last task', async () => {
  let launches = 0;
  let closes = 0;
  let contexts = 0;
  const manager = new BrowserManager(async () => {
    launches++;
    await tick();
    return {
      connected: true,
      createBrowserContext: async () => {
        const id = ++contexts;
        return { newPage: async () => ({ id }), close: async () => {} };
      },
      close: async () => { closes++; }
    };
  }, 2);
  let finishFirst;
  let finishSecond;
  let ready;
  let started = 0;
  const allStarted = new Promise(resolve => { ready = resolve; });
  const first = manager.run(async page => { await new Promise(resolve => { finishFirst = resolve; if (++started === 2) ready(); }); return page.id; });
  const second = manager.run(async page => { await new Promise(resolve => { finishSecond = resolve; if (++started === 2) ready(); }); return page.id; });
  await allStarted;
  assert.equal(launches, 1);
  await assert.rejects(manager.run(async () => {}), /已满/);
  finishFirst();
  assert.equal(await first, 1);
  assert.equal(closes, 0);
  finishSecond();
  assert.equal(await second, 2);
  assert.equal(closes, 1);
  await assert.rejects(manager.run(async () => { throw Error('page failed'); }), /page failed/);
  assert.equal(manager.active, 0);
  assert.equal(closes, 2);
  await manager.close();
  await assert.rejects(manager.run(async () => {}), /已关闭/);
});

test('bounded sweeping reaches expired entries beyond the first batches', () => {
  let now = 0;
  const store = makeStore({ maxBytes: 1024 * 1024, maxEntries: 1000, evict: false, clock: () => now });
  for (let i = 0; i < 1000; i++) store.set('key-' + i, 'value', 10);
  now = 10;
  for (let i = 0; i < 101; i++) store.sweep(10);
  assert.equal(store.entries.size, 0);
  assert.equal(store.budget.used, 0);
});

test('high cache churn retains bounded entries and accounting', () => {
  const store = makeStore({ maxEntries: 20, maxBytes: 8192 });
  for (let i = 0; i < 20000; i++) store.set('key-' + i, 'value');
  assert.equal(store.entries.size, 20);
  assert(store.bytes <= 8192);
  store.clear();
  assert.equal(store.bytes, 0);
  assert.equal(store.budget.used, 0);
});
