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
    const server = global.runningServer[serverId].server;
    const ssh = new Client();
    ssh.on('ready', () => {
      logger.info(`[${serverId}]`, server.alias, 'shell 已开始连接');
      ssh.shell({ term: 'xterm-256color' }, function (err, stream) {
        if (err) {
          return ws.send('\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
        }
        ws.on('message', function (data) {
          data = data || '';
          if (typeof data === 'string' && data.startsWith('setWindow')) {
            stream.setWindow(data.split(':')[1], data.split(':')[2]);
            return;
          }
          stream.write(data);
        });
        stream.on('close', () => {
          ws.send('\r\n*** SSH SHELL DISCONNECTED ***\r\n');
        }).on('data', (data) => {
          ws.send(data.toString());
        });
      });
    }).on('error', (e) => {
      logger.error(e);
      ws.send('\r\n*** SSH SHELL ERROR: ' + e.message + ' ***\r\n');
    }).connect(server);
    ws.on('close', () => {
      logger.info(`[${serverId}]`, server.alias, 'shell 已断开连接');
      ssh.end();
    }).on('error', (e) => {
      logger.error(server.alias, e);
      ssh.end();
    });
  }
}

module.exports = ServerMod;
