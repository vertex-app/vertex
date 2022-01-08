const logger = require('../libs/logger');
const util = require('../libs/util');
const fs = require('fs');
const path = require('path');
const Server = require('../common/Server');

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
    for (const server of serverList) {
      server.status = global.runningServer[server.id].ssh && global.runningServer[server.id].ssh.isConnected();
    }
    return serverList;
  };

  async netSpeed () {
    try {
      const list = util.listServer()
        .filter(item => item.enable)
        .map(item => global.runningServer[item.id])
        .filter(item => global.runningServer[item.id].ssh.isConnected());
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
        .filter(item => global.runningServer[item.id].ssh.isConnected());
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
        .filter(item => global.runningServer[item.id].ssh.isConnected());
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
        .filter(item => global.runningServer[item.id].ssh.isConnected());
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
      return { fiveminute, hour, day, month };
    } catch (e) {
      logger.error(e);
      throw e.message;
    }
  }
}

module.exports = ServerMod;
