const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { promisify } = require('node:util');
const request = promisify(require('@cypress/request'));

async function listen (t, handler) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('HTTP replacement preserves JSON, forms, binary responses and error status codes', async t => {
  const base = await listen(t, async (req, res) => {
    if (req.url === '/binary') return res.end(Buffer.from([0, 255, 128, 10]));
    if (req.url === '/unauthorized') { res.statusCode = 401; return res.end('denied'); }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ body: Buffer.concat(chunks).toString(), type: req.headers['content-type'], cookie: req.headers.cookie }));
  });
  const json = await request({ url: base, method: 'POST', json: { text: '中文' }, headers: { cookie: 'session=test' } });
  assert.equal(json.body.body, '{"text":"中文"}');
  assert.equal(json.body.cookie, 'session=test');
  const form = await request({ url: base, method: 'POST', form: { value: 'a+b' } });
  assert.equal(JSON.parse(form.body).body, 'value=a%2Bb');
  const multipart = await request({ url: base, method: 'POST', formData: { torrents: { value: Buffer.from('torrent-bytes'), options: { filename: 'test.torrent' } } } });
  assert.match(JSON.parse(multipart.body).body, /filename="test.torrent"/);
  assert.match(JSON.parse(multipart.body).body, /torrent-bytes/);
  assert.deepEqual((await request({ url: base + '/binary', encoding: null })).body, Buffer.from([0, 255, 128, 10]));
  assert.equal((await request(base + '/unauthorized')).statusCode, 401);
});

test('HTTP replacement preserves redirects, proxy routing and timeouts', async t => {
  const target = await listen(t, (req, res) => {
    if (req.url === '/slow') return;
    if (req.url === '/redirect') { res.writeHead(302, { location: '/ok' }); return res.end(); }
    res.end('ok');
  });
  assert.equal((await request(target + '/redirect')).body, 'ok');
  let proxyUrl;
  const proxy = await listen(t, (req, res) => { proxyUrl = req.url; res.end('proxied'); });
  assert.equal((await request({ url: 'http://example.invalid/resource', proxy })).body, 'proxied');
  assert.equal(proxyUrl, 'http://example.invalid/resource');
  await assert.rejects(request({ url: target + '/slow', timeout: 30 }), err => ['ESOCKETTIMEDOUT', 'ETIMEDOUT'].includes(err.code));
});

test('new upload middleware accepts backup files and cleans temporary files', async t => {
  const express = require('express');
  const upload = require('../app/libs/upload');
  const app = express();
  let file;
  app.post('/restore', (req, res, next) => req.headers.authorization === 'test' ? next() : res.sendStatus(401), upload, (req, res) => {
    file = req.file.path;
    assert.equal(fs.statSync(path.dirname(file)).mode & 0o777, 0o700);
    res.json({ name: req.file.originalname, body: fs.readFileSync(file, 'utf8'), field: req.body.field });
  });
  const base = await listen(t, app);
  assert.equal((await request({ url: base + '/restore', method: 'POST', formData: { file: 'blocked' } })).statusCode, 401);
  assert.equal(file, undefined);
  const response = await request({ url: base + '/restore', method: 'POST', headers: { authorization: 'test' }, formData: { field: '中文', file: { value: Buffer.from('backup'), options: { filename: 'backup.tar.gz' } } }, json: true });
  assert.deepEqual(response.body, { name: 'backup.tar.gz', body: 'backup', field: '中文' });
  for (let i = 0; i < 50 && fs.existsSync(file); i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(fs.existsSync(file), false);
  assert.equal((await request({ url: base + '/restore', method: 'POST', headers: { authorization: 'test' } })).statusCode, 400);
});

test('updated HTTP proxy forwards parsed JSON and authentication headers', async t => {
  const target = await listen(t, async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ url: req.url, body: Buffer.concat(chunks).toString(), cookie: req.headers.cookie }));
  });
  const app = require('express')();
  app.use(require('express').json());
  app.use('/proxy', require('express-http-proxy')(target, {
    reqBodyEncoding: null,
    proxyReqOptDecorator: options => { options.headers.cookie = 'downloader=test'; return options; }
  }));
  const base = await listen(t, app);
  const response = await request({ url: base + '/proxy/api', method: 'POST', json: { text: '中文' } });
  assert.deepEqual(response.body, { url: '/api', body: '{"text":"中文"}', cookie: 'downloader=test' });
});

test('XML parser preserves RSS arrays and rejects malformed input', async () => {
  const parse = promisify(require('xml2js').parseString);
  const result = await parse('<rss><channel><item><title>中文</title><enclosure url="https://example.invalid/test.torrent"/></item></channel></rss>');
  assert.equal(result.rss.channel[0].item[0].title[0], '中文');
  assert.equal(result.rss.channel[0].item[0].enclosure[0].$.url, 'https://example.invalid/test.torrent');
  await assert.rejects(parse('<rss><channel></rss>'));
});

test('tar backup and restore preserve Chinese filenames and binary content', async t => {
  const tar = require('tar');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vertex-deps-tar-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const source = path.join(dir, 'source');
  const restored = path.join(dir, 'restored');
  fs.mkdirSync(source); fs.mkdirSync(restored);
  const content = Buffer.from([0, 255, 128, 10]);
  fs.writeFileSync(path.join(source, '中文.db'), content);
  const file = path.join(dir, 'backup.tar.gz');
  await tar.c({ gzip: true, file, cwd: source }, ['中文.db']);
  await tar.x({ gzip: true, file, C: restored });
  assert.deepEqual(fs.readFileSync(path.join(restored, '中文.db')), content);
});

test('all torrent download paths preserve names, bytes and info hashes with bencode 4', async () => {
  const bencode = await require('../app/libs/bencode')();
  const info = { name: '中文.torrent', length: 123, 'piece length': 16384, pieces: Buffer.alloc(20, 128) };
  const buffer = Buffer.from(bencode.encode({ info }));
  const expectedHash = crypto.createHash('sha1').update(bencode.encode(info)).digest('hex');
  for (const relative of ['app/common/Site.js', 'app/common/Rss.js', 'app/libs/rss.js']) {
    const filename = path.resolve(__dirname, '..', relative);
    const localRequire = createRequire(filename);
    let written;
    const module = { exports: {} };
    const util = { promisify, requestPromise: async () => ({ body: buffer, headers: { 'content-type': 'application/x-bittorrent' } }) };
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
      module,
      exports: module.exports,
      __dirname: path.dirname(filename),
      Buffer,
      require: name => {
        if (name.endsWith('/util')) return util;
        if (name === 'fs') return { existsSync: () => false, writeFileSync: (file, bytes) => { written = bytes; } };
        if (name.endsWith('/logger') || name === './Push' || name === '../libs/rss') return {};
        return localRequire(name);
      }
    });
    const download = typeof module.exports === 'function' ? module.exports.prototype._downloadTorrent : module.exports.getTorrentNameByBencode;
    const result = await download.call({}, 'https://example.invalid/test.torrent');
    assert.equal(result.name, '中文.torrent', relative);
    assert.equal(result.size, 123, relative);
    assert.equal(result.hash, expectedHash, relative);
    assert.deepEqual(written, buffer, relative);
  }
});

test('cron tasks can execute and be permanently removed on reload', async () => {
  const cron = require('node-cron');
  const tasksBefore = cron.getTasks().size;
  let calls = 0;
  const task = cron.schedule('0 0 1 1 *', () => { calls++; });
  try {
    assert.equal(cron.getTasks().size, tasksBefore + 1);
    await task.execute();
    assert.equal(calls, 1);
  } finally { task.destroy(); }
  assert.equal(task.getStatus(), 'destroyed');
  assert.equal(cron.getTasks().size, tasksBefore);
});
