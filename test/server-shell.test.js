const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRequire } = require('module');

const logger = { info () {}, error () {}, debug () {} };
const load = (file, overrides, globals = {}) => {
  const filename = path.resolve(__dirname, '..', file);
  const localRequire = createRequire(filename);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module,
    Buffer,
    global: globals,
    require: name => Object.prototype.hasOwnProperty.call(overrides, name) ? overrides[name] : localRequire(name)
  });
  return module.exports;
};

class Socket extends EventEmitter {
  constructor () {
    super();
    this.readyState = 1;
    this.messages = [];
  }

  send (message, callback) {
    if (this.sendError) throw Error('socket closed during send');
    this.messages.push(String(message));
    if (callback) callback();
  }

  close (code, reason) {
    this.readyState = 3;
    this.code = code;
    this.reason = reason;
    this.emit('close');
  }
}

const fixture = (runningServer = {}, mode = 'ready') => {
  const clients = [];
  class Client extends EventEmitter {
    constructor () {
      super();
      this.ends = 0;
      clients.push(this);
    }

    connect () {
      if (mode === 'throw') throw Error('invalid options');
      if (mode === 'connect-error') queueMicrotask(() => this.emit('error', Error('authentication failed')));
      else queueMicrotask(() => this.emit('ready'));
      return this;
    }

    shell (options, callback) {
      if (mode === 'shell-error') return callback(Error('shell rejected'));
      this.stream = new EventEmitter();
      this.stream.writes = [];
      this.stream.windows = [];
      this.stream.end = () => {};
      this.stream.write = data => this.stream.writes.push(data);
      this.stream.setWindow = (...values) => this.stream.windows.push(values);
      callback(null, this.stream);
    }

    end () { this.ends++; }
  }
  const Model = load('app/model/ServerMod.js', {
    '../libs/logger': logger,
    '../libs/util': {},
    '../common/Server': class {},
    ssh2: { Client }
  }, { runningServer });
  return { Model, model: new Model(), clients };
};

const controllerFor = Model => {
  const Controller = load('app/controller/Server.js', { '../model/ServerMod': Model, '../libs/logger': logger });
  return new Controller();
};

const active = { active: { server: { enable: true, alias: 'local-test' } } };
const request = serverId => ({ params: { serverId } });
const tick = () => new Promise(resolve => setImmediate(resolve));

test('missing, disabled and inherited server IDs do not create SSH clients', async () => {
  const f = fixture({ disabled: { server: { enable: false } } });
  for (const id of ['missing', 'disabled', '__proto__']) {
    await assert.rejects(f.model.shell(new Socket(), request(id)), { code: 'SERVER_NOT_AVAILABLE' });
  }
  assert.equal(f.clients.length, 0);
});

test('WebSocket controller consumes asynchronous model failures', async () => {
  class Model { async shell () { throw Error('unexpected failure'); } }
  const controller = controllerFor(Model);
  const socket = new Socket();
  await controller.shell(socket, request('missing'));
  assert.equal(socket.code, 1011);
  assert(socket.messages[0].includes('终端连接失败'));
  const closed = new Socket();
  closed.readyState = 3;
  await controller.shell(closed, request('missing'));
  assert.equal(closed.messages.length, 0);
});

test('SSH setup, authentication and shell errors close only their own connection', async () => {
  for (const mode of ['throw', 'connect-error', 'shell-error']) {
    const f = fixture(active, mode);
    const socket = new Socket();
    await f.model.shell(socket, request('active'));
    await tick();
    assert.equal(socket.code, 1011, mode);
    assert.equal(f.clients[0].ends, 1, mode);
  }
});

test('SSH stream errors, resize frames and socket send races are handled', async () => {
  const f = fixture(active);
  const socket = new Socket();
  await f.model.shell(socket, request('active'));
  await tick();
  const client = f.clients[0];
  socket.emit('message', Buffer.from('setWindow:24:80'), false);
  socket.emit('message', 'setWindow:NaN:80', false);
  assert.deepEqual(client.stream.windows, [[24, 80]]);
  socket.emit('message', Buffer.from('echo hello'), false);
  assert.equal(client.stream.writes[0], 'echo hello');
  socket.sendError = true;
  assert.doesNotThrow(() => client.stream.emit('data', Buffer.from('output')));
  assert.equal(socket.code, 1011);
  assert.equal(client.ends, 1);
  assert.doesNotThrow(() => client.stream.emit('error', Error('late error')));
  assert.doesNotThrow(() => client.emit('error', Error('late SSH error')));
  assert.equal(client.ends, 1);
});

test('an invalid terminal WebSocket does not bring down the HTTP server', async t => {
  const express = require('express');
  const http = require('http');
  const WebSocket = require('ws');
  const app = express();
  const server = http.createServer(app);
  require('express-ws')(app, server);
  const f = fixture();
  const controller = controllerFor(f.Model);
  app.ws('/shell/:serverId', controller.shell.bind(controller));
  app.get('/health', (req, res) => res.send('alive'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const address = '127.0.0.1:' + server.address().port;
  const socket = new WebSocket('ws://' + address + '/shell/missing');
  let output = '';
  socket.on('message', value => { output += value.toString(); });
  const code = await new Promise((resolve, reject) => { socket.once('close', resolve); socket.once('error', reject); });
  assert.equal(code, 1011);
  assert(output.includes('服务器未启用或不存在'));
  const response = await fetch('http://' + address + '/health');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'alive');
  assert.equal(f.clients.length, 0);
});
