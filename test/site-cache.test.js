const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRequire } = require('module');
const { Cache } = require('../app/libs/memory/cache');
const { Store } = require('../app/libs/memory/store');

const loadSite = () => {
  const filename = path.resolve(__dirname, '../app/common/Site.js');
  const localRequire = createRequire(filename);
  const memory = new Cache({ cache: new Store({ maxBytes: 16384, maxEntries: 10 }) });
  let calls = 0;
  const util = {
    requestPromise: async options => {
      calls++;
      await new Promise(resolve => setImmediate(resolve));
      return { body: `<p>${options.headers.cookie}</p>`, headers: { 'set-cookie': ['PHPSESSID=fresh; Path=/'] } };
    }
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module,
    Buffer,
    require: name => {
      if (name === '../libs/util') return util;
      if (name === '../libs/logger' || name === 'node-cron') return {};
      if (name === '../libs/memory/cache') return memory;
      return localRequire(name);
    }
  });
  return { getDocument: module.exports.prototype._getDocument, calls: () => calls };
};

test('HTML cache isolates accounts and combines concurrent misses', async () => {
  const site = loadSite();
  const first = { cookie: 'account-a' };
  const results = await Promise.all([site.getDocument.call(first, 'https://example.invalid/'), site.getDocument.call(first, 'https://example.invalid/')]);
  assert.equal(results[0].querySelector('p').textContent, 'account-a');
  assert.equal(site.calls(), 1);
  const second = await site.getDocument.call({ cookie: 'account-b' }, 'https://example.invalid/');
  assert.equal(second.querySelector('p').textContent, 'account-b');
  assert.equal(site.calls(), 2);
});

test('cookie refresh always returns fresh response and a consistent shape', async () => {
  const site = loadSite();
  const account = { cookie: 'account-a' };
  await site.getDocument.call(account, 'https://example.invalid/');
  for (let i = 0; i < 2; i++) {
    const result = await site.getDocument.call(account, 'https://example.invalid/', false, 10, true);
    assert.equal(result.dom.querySelector('p').textContent, 'account-a');
    assert.equal(result.cookie[0], 'PHPSESSID=fresh; Path=/');
  }
  assert.equal(site.calls(), 3);
});
