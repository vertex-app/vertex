const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const session = require('express-session');
const MemorySessionStore = require('../app/libs/memory/session-store');
const { Store } = require('../app/libs/memory/store');

async function fixture (t, maxEntries = 3) {
  const data = new Store({ maxBytes: 16384, maxEntries, maxValueBytes: 4096, evict: false });
  const store = new MemorySessionStore({ store: data });
  const app = express();
  app.use(store.trackRequest.bind(store));
  app.use(session({ store, secret: 'local-session-test-only', resave: false, saveUninitialized: false, rolling: true, cookie: { maxAge: 1000 } }));
  app.get('/login', (req, res) => {
    req.session.user = 'tester';
    req.session.save(err => {
      if (err) { req.session = null; return res.status(503).end(); }
      res.send('ok');
    });
  });
  app.get('/me', (req, res) => res.status(req.session.user ? 200 : 401).end());
  app.get('/logout', (req, res) => req.session.destroy(err => res.status(err ? 500 : 200).end()));
  let slowReady;
  const started = new Promise(resolve => { slowReady = resolve; });
  let releaseSlow;
  app.get('/slow', async (req, res) => {
    req.session.user = 'old';
    slowReady();
    await new Promise(resolve => { releaseSlow = resolve; });
    req.session.save(err => {
      req.session = null;
      res.status(err ? 409 : 200).end();
    });
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = 'http://127.0.0.1:' + server.address().port;
  const request = async (pathname, cookie) => {
    const response = await fetch(url + pathname, { headers: cookie ? { cookie } : {} });
    await response.text();
    return response;
  };
  return { request, store, data, started, release: () => releaseSlow() };
}

test('HTTP login, rolling session, logout and metadata cleanup', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('/me')).status, 401);
  const login = await f.request('/login');
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await f.request('/me', cookie)).status, 200);
  assert.equal((await f.request('/logout', cookie)).status, 200);
  assert.equal((await f.request('/me', cookie)).status, 401);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.store.requests, 0);
  assert.equal(f.store.states.size, 0);
});

test('a late concurrent save cannot resurrect a logged-out session', async t => {
  const f = await fixture(t);
  const login = await f.request('/login');
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const slow = f.request('/slow', cookie);
  await f.started;
  await f.request('/logout', cookie);
  f.release();
  assert.equal((await slow).status, 409);
  assert.equal((await f.request('/me', cookie)).status, 401);
});

test('capacity rejects a new login without evicting an existing valid session', async t => {
  const f = await fixture(t, 1);
  const first = await f.request('/login');
  const cookie = first.headers.get('set-cookie').split(';')[0];
  assert.equal((await f.request('/login')).status, 503);
  assert.equal((await f.request('/me', cookie)).status, 200);
});

test('session TTL, snapshot isolation and missing touch', async () => {
  let now = 0;
  const data = new Store({ maxBytes: 16384, maxEntries: 3, maxValueBytes: 4096, evict: false, clock: () => now });
  const store = new MemorySessionStore({ store: data });
  const call = (method, ...args) => new Promise((resolve, reject) => store[method](...args, (err, value) => err ? reject(err) : resolve(value)));
  await call('set', 'sid', { user: 'tester', cookie: { expires: new Date(Date.now() + 1000) } });
  const snapshot = await call('get', 'sid');
  snapshot.user = 'changed';
  assert.equal((await call('get', 'sid')).user, 'tester');
  now = 1001;
  assert.equal(await call('get', 'sid'), null);
  await call('touch', 'sid', { cookie: { expires: new Date(Date.now() + 1000) } });
  assert.equal(await call('get', 'sid'), null);
});

test('WebSocket sessions release request tracking when the socket closes', async t => {
  const http = require('http');
  const WebSocket = require('ws');
  const app = express();
  const server = http.createServer(app);
  require('express-ws')(app, server);
  const store = new MemorySessionStore();
  app.use(store.trackRequest.bind(store));
  app.use(session({ store, secret: 'websocket-local-test', resave: false, saveUninitialized: false }));
  app.ws('/echo', socket => socket.on('message', value => socket.send(value)));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const socket = new WebSocket('ws://127.0.0.1:' + server.address().port + '/echo');
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  const message = new Promise(resolve => socket.once('message', resolve));
  socket.send('hello');
  assert.equal(String(await message), 'hello');
  await new Promise(resolve => { socket.once('close', resolve); socket.close(); });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(store.requests, 0);
  assert.equal(store.states.size, 0);
});
