const fs = require('fs');
const path = require('path');
const Client = require('../common/Client');

const util = require('../libs/util');
class ClientMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const clientSet = { ...options };
    clientSet.id = id;
    clientSet.deleteRules = clientSet.deleteRules || [];
    clientSet.sameServerClients = clientSet.sameServerClients || [];
    clientSet.sameServerClients.push(id);
    fs.writeFileSync(path.join(__dirname, '../data/client/', id + '.json'), JSON.stringify(clientSet, null, 2));
    if (global.runningClient[id]) global.runningClient[id].destroy();
    if (clientSet.enable) global.runningClient[id] = new Client(clientSet);
    return '添加下载器成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/client/', options.id + '.json'));
    if (global.runningClient[options.id]) global.runningClient[options.id].destroy();
    return '删除下载器成功';
  };

  modify (options) {
    const clientSet = { ...options };
    clientSet.deleteRules = clientSet.deleteRules || [];
    clientSet.sameServerClients = clientSet.sameServerClients || [];
    if (global.runningClient[options.id]) global.runningClient[options.id].destroy();
    if (clientSet.enable) global.runningClient[options.id] = new Client(clientSet);
    fs.writeFileSync(path.join(__dirname, '../data/client/', options.id + '.json'), JSON.stringify(clientSet, null, 2));
    return '修改下载器成功';
  };

  list () {
    const rssList = util.listRss();
    const doubanList = util.listDouban();
    const clientList = util.listClient();
    for (const client of clientList) {
      client.used = rssList.some(item => (item.clientArr || [item.client]).indexOf(client.id) !== -1) ||
        rssList.some(item => item.reseedClients.indexOf(client.id) !== -1) ||
        doubanList.some(item => item.client === client.id);
      client.status = !!(client.enable && global.runningClient[client.id].status && global.runningClient[client.id].maindata);
      if (client.status) {
        client.allTimeUpload = global.runningClient[client.id].maindata.allTimeUpload;
        client.allTimeDownload = global.runningClient[client.id].maindata.allTimeDownload;
        client.uploadSpeed = global.runningClient[client.id].maindata.uploadSpeed;
        client.downloadSpeed = global.runningClient[client.id].maindata.downloadSpeed;
        client.leechingCount = global.runningClient[client.id].maindata.leechingCount;
        client.seedingCount = global.runningClient[client.id].maindata.seedingCount;
      }
    }
    return clientList;
  };

  async getSpeedPerTracker () {
    const clients = global.runningClient;
    const trackers = {};
    for (const clientId of Object.keys(clients)) {
      if (!clients[clientId].maindata) continue;
      for (const torrent of clients[clientId].maindata.torrents) {
        const _tracker = torrent.tracker || '错误状态';
        const tracker = _tracker.match(/.*?([^.]*\.[^.]*$)/)[1];
        if (!trackers[tracker]) trackers[tracker] = { upload: 0, download: 0 };
        trackers[tracker].upload += torrent.uploadSpeed;
        trackers[tracker].download += torrent.downloadSpeed;
      }
    }
    const trackerArr = Object.keys(trackers).map(i => {
      return {
        ...trackers[i],
        tracker: i
      };
    });
    return {
      trackerList: trackerArr,
      trackers: Object.keys(trackers)
    };
  }
}

module.exports = ClientMod;
