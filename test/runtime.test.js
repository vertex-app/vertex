const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

test('Node 26 native SQLite driver writes, transacts and reopens a database', t => {
  assert.equal(process.versions.node.split('.')[0], '26');
  const Database = require('better-sqlite3');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vertex-db-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'sql.db');
  let db = new Database(file);
  db.exec('CREATE TABLE records (id INTEGER PRIMARY KEY, value TEXT)');
  const insert = db.prepare('INSERT INTO records (value) VALUES (?)');
  db.transaction(() => { insert.run('中文'); insert.run('second'); })();
  assert.throws(db.transaction(() => { insert.run('rollback'); throw Error('rollback'); }), /rollback/);
  assert.equal(db.prepare('SELECT count(*) AS total FROM records').get().total, 2);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  db.close();
  db = new Database(file);
  assert.equal(db.prepare('SELECT value FROM records WHERE id=1').get().value, '中文');
  db.close();
});

test('Puppeteer extra and stealth load on the target runtime', () => {
  const puppeteer = require('puppeteer-extra');
  const stealth = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(stealth());
  assert.equal(typeof puppeteer.launch, 'function');
});

test('SSH client and server handshake and execute on Node 26', async t => {
  const { generateKeyPairSync } = require('crypto');
  const { Server, Client } = require('ssh2');
  const key = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs1', format: 'pem' });
  const server = new Server({ hostKeys: [key] }, connection => {
    connection.on('authentication', context => context.accept());
    connection.on('ready', () => {
      connection.on('session', accept => {
        accept().on('exec', (accept, reject, info) => {
          const stream = accept();
          stream.write('node26-ok');
          stream.exit(0);
          stream.end();
        });
      });
    });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const client = new Client();
  t.after(() => { client.end(); return new Promise(resolve => server.close(resolve)); });
  const output = await new Promise((resolve, reject) => {
    client.once('error', reject);
    client.once('ready', () => {
      client.exec('local-test', (err, stream) => {
        if (err) return reject(err);
        let data = '';
        stream.on('data', chunk => { data += chunk; });
        stream.once('close', () => { client.end(); resolve(data); });
      });
    });
    client.connect({ host: '127.0.0.1', port: server.address().port, username: 'test-only', readyTimeout: 5000 });
  });
  assert.equal(output, 'node26-ok');
});
