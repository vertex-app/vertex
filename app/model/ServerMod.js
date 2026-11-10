const logger = require('../libs/logger');
const util = require('../libs/util');
const fs = require('fs');
const path = require('path');
const Server = require('../common/Server');
const { Client } = require('ssh2');

class ServerMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const serverSet = { ...options };
    serverSet.id = id;
    if (serverSet.enable) {
      global.runningServer[id] = new Server(serverSet);
    }
    fs.writeFileSync(path.join(__dirname, '../data/server/', id + '.json'), JSON.stringify(serverSet, null, 2));
    return '添加 Server 成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/server/', options.id + '.json'));
    if (global.runningServer[options.id]) global.runningServer[options.id].destroy();
    return '删除 Server 成功';
  };

  modify (options) {
    const serverSet = { ...options };
    if (global.runningServer[options.id]) global.runningServer[options.id].destroy();
    global.runningServer[options.id] = new Server(serverSet);
    fs.writeFileSync(path.join(__dirname, '../data/server/', options.id + '.json'), JSON.stringify(serverSet, null, 2));
    return '修改 Server 成功';
  };

  list () {
    const serverList = util.listServer();
    const linkRuleList = util.listLinkRule();
    for (const server of serverList) {
      server.used = linkRuleList.filter(item => item.server === server.id).length !== 0;
      server.status = global.runningServer[server.id] && global.runningServer[server.id].ssh && global.runningServer[server.id].connected;
    }
    return serverList;
  };

  reload (serverId) {
    if (global.runningServer[serverId]) global.runningServer[serverId].destroy();
    global.runningServer[serverId] = new Server(util.listServer().filter(item => item.id === serverId)[0]);
    return '重连 Server 成功';
  };

  async netSpeed () {
    try {
      const list = util.listServer()
        .filter(item => item.enable)
        .map(item => global.runningServer[item.id])
        .filter(item => item.connected);
      const result = await Promise.all(list.map(item => item.getNetSpeed()));
      const netSpeed = {};
      for (let i = 0; i < result.length; i++) {
        netSpeed[list[i].id] = result[i];
      }
      return netSpeed;
    } catch (e) {
      logger.error(e);
      throw e.message;
    }
  };

  async cpuUse () {
    try {
      const list = util.listServer()
        .filter(item => item.enable)
        .map(item => global.runningServer[item.id])
        .filter(item => item.connected);
      const result = await Promise.all(list.map(item => item.getCpuUse()));
      const cpuUse = {};
      for (let i = 0; i < result.length; i++) {
        cpuUse[list[i].id] = result[i];
      }
      return cpuUse;
    } catch (e) {
      logger.error(e);
      throw e.message;
    }
  };

  async diskUse () {
    try {
      const list = util.listServer()
        .filter(item => item.enable)
        .map(item => global.runningServer[item.id])
        .filter(item => item.connected);
      const result = await Promise.all(list.map(item => item.getDiskUse()));
      const diskUse = {};
      for (let i = 0; i < result.length; i++) {
        diskUse[list[i].id] = result[i];
      }
      return diskUse;
    } catch (e) {
      logger.error(e);
      throw e.message;
    }
  };

  async memoryUse () {
    try {
      const list = util.listServer()
        .filter(item => item.enable)
        .map(item => global.runningServer[item.id])
        .filter(item => item.connected);
      const result = await Promise.all(list.map(item => item.getMemoryUse()));
      const memoryUse = {};
      for (let i = 0; i < result.length; i++) {
        memoryUse[list[i].id] = result[i];
      }
      return memoryUse;
    } catch (e) {
      logger.error(e);
      throw e.message;
    }
  };

  async vnstat (id) {
    if (!id) throw 'bad request';
    try {
      const [fiveminute, hour, day, month] = await Promise.all([
        global.runningServer[id].getVnstat5(),
        global.runningServer[id].getVnstatHour(),
        global.runningServer[id].getVnstatDay(),
        global.runningServer[id].getVnstatMonth()
      ]);
      fiveminute.interfaces[0].traffic.fiveminute = fiveminute.interfaces[0].traffic.fiveminute.reverse();
      hour.interfaces[0].traffic.hour = hour.interfaces[0].traffic.hour.reverse();
      day.interfaces[0].traffic.day = day.interfaces[0].traffic.day.reverse();
      month.interfaces[0].traffic.month = month.interfaces[0].traffic.month.reverse();
      return { fiveminute, hour, day, month };
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  async shell (ws, req) {
    const serverId = req.params.serverId;
    const running = global.runningServer;
    const instance = running && Object.prototype.hasOwnProperty.call(running, serverId) ? running[serverId] : null;
    if (!instance || !instance.server || instance.server.enable === false) {
      const error = new Error('服务器未启用或不存在，请先启用后重试');
      error.code = 'SERVER_NOT_AVAILABLE';
      throw error;
    }
    if (ws.readyState !== 1) return;
    const server = instance.server;
    const ssh = new Client();
    let stream;
    let ended = false;
    const send = message => {
      if (!message || ws.readyState !== 1) return;
      try {
        ws.send(message, err => { if (err) finish(null, 1011); });
      } catch (err) {
        finish(null, 1011);
      }
    };
    const finish = (message, code = 1000) => {
      if (ended) return;
      ended = true;
      send(message);
      try { if (stream) stream.end(); } catch (err) { logger.debug('终端流已关闭'); }
      try { ssh.end(); } catch (err) { logger.debug('SSH 连接已关闭'); }
      if (ws.readyState === 1) {
        try { ws.close(code, 'SSH 终端已关闭'); } catch (err) { logger.debug('终端连接已关闭'); }
      }
    };
    const fail = err => {
      if (ended) return;
      logger.error(server.alias, 'SSH 终端连接失败', err);
      finish('\r\n*** SSH 终端连接失败，请检查连接配置或稍后重试 ***\r\n', 1011);
    };
    ws.on('close', () => finish());
    ws.on('error', fail);
    ws.on('message', (data, isBinary) => {
      if (ended || !stream) return;
      try {
        const text = typeof data === 'string' ? data : Buffer.isBuffer(data) && !isBinary ? data.toString('utf8') : null;
        if (text && text.startsWith('setWindow:')) {
          const [rows, cols] = text.slice('setWindow:'.length).split(':').map(Number);
          if ([rows, cols].every(value => Number.isInteger(value) && value > 0 && value <= 1000)) stream.setWindow(rows, cols);
          return;
        }
        stream.write(text === null ? data : text);
      } catch (err) {
        fail(err);
      }
    });
    ssh.on('ready', () => {
      if (ended || ws.readyState !== 1) {
        finish();
        return;
      }
      try {
        ssh.shell({ term: 'xterm-256color' }, (err, channel) => {
          if (err) return fail(err);
          if (ended || ws.readyState !== 1) {
            channel.end();
            return;
          }
          stream = channel;
          stream.on('data', data => send(data.toString()));
          stream.on('error', fail);
          stream.on('close', () => finish('\r\n*** SSH 终端已断开 ***\r\n'));
        });
      } catch (err) {
        fail(err);
      }
    });
    ssh.on('error', fail);
    ssh.on('close', () => finish('\r\n*** SSH 终端已断开 ***\r\n'));
    try { ssh.connect(server); } catch (err) { fail(err); }
  }
}

module.exports = ServerMod;
