const util = require('../util');
const url = require('url');
const fs = require('fs');

exports.login = async function (username, clientUrl, password) {
  const basic = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
  const message = {
    method: 'POST',
    url: clientUrl + '/transmission/rpc',
    headers: {
      Authorization: basic
    }
  };
  const res = await util.requestPromise(message);
  const sessionId = res.headers['x-transmission-session-id'];
  if (!sessionId) {
    throw new Error('下载器' + clientUrl + '登录失败, 请检查账号密码是否正确');
  }
  return {
    sessionId,
    basic
  };
};

exports.addTorrentByTorrentFile = async function (clientUrl, cookie, filepath, isSkipChecking, uploadLimit, downloadLimit, savePath, category, autoTMM) {
  const message = {
    method: 'POST',
    url: clientUrl + '/transmission/rpc',
    headers: {
      Authorization: cookie.basic,
      'X-Transmission-Session-Id': cookie.sessionId
    },
    form: {
      method: 'torrent-add',
      arguments: {
        metainfo: Buffer.from(fs.readFileSync(filepath)).toString('base64'),
        'download-dir': savePath
      },
      tag: ''
    }
  };
  if (savePath) {
    message.form.arguments.savepath = savePath;
  }
  if (category) {
    message.form.arguments.labels = [category];
  }
  message.form = JSON.stringify(message.form);
  const res = await util.requestPromise(message);
  return res;
};

exports.getSessionStat = async function (clientUrl, cookie) {
  const message = {
    method: 'POST',
    url: clientUrl + '/transmission/rpc',
    headers: {
      Authorization: cookie.basic,
      'X-Transmission-Session-Id': cookie.sessionId
    },
    form: JSON.stringify({
      method: 'session-stats',
      arguments: {
        fields:
        []
      }
    })
  };
  const res = await util.requestPromise(message);
  return JSON.parse(res.body).arguments;
};

exports.getMaindata = async function (clientUrl, cookie) {
  const message = {
    method: 'POST',
    url: clientUrl + '/transmission/rpc',
    headers: {
      Authorization: cookie.basic,
      'X-Transmission-Session-Id': cookie.sessionId
    },
    form: JSON.stringify({
      method: 'torrent-get',
      arguments: {
        fields:
        [
          'id', 'name', 'status', 'hashString', 'totalSize', 'percentDone',
          'addedDate', 'trackers', 'leftUntilDone', 'rateDownload', 'rateUpload',
          'uploadRatio', 'uploadedEver', 'downloadedEver', 'downloadDir', 'doneDate',
          'labels'
        ]
      },
      tag: ''
    })
  };
  const res = await util.requestPromise(message);
  if (res.headers['x-transmission-session-id'] && res.statusCode === 409) {
    return res.headers['x-transmission-session-id'];
  }
  const torrents = JSON.parse(res.body).arguments.torrents;
  const torrentFilter = {
    id: 'id',
    hash: 'hashString',
    name: 'name',
    uploadSpeed: 'rateUpload',
    downloadSpeed: 'rateDownload',
    size: 'totalSize',
    progress: 'percentDone',
    tracker: 'trackers',
    uploaded: 'uploadedEver',
    downloaded: 'downloadedEver',
    ratio: 'uploadRatio',
    state: 'status',
    addedTime: 'addedDate',
    savePath: 'downloadDir'
  };
  const maindata = {
    torrents: []
  };
  for (const k of torrents) {
    const torrent = {};
    for (const kk in torrentFilter) {
      torrent[kk] = k[torrentFilter[kk]];
    }
    torrent.completed = torrent.size * torrent.progress;
    torrent.originProp = { k };
    torrent.tracker = torrent.tracker && torrent.tracker[0] ? new url.URL(torrent.tracker[0].announce).hostname : '';
    maindata.torrents.push(torrent);
  }
  const sessionStat = await exports.getSessionStat(clientUrl, cookie);
  maindata.allTimeUpload = sessionStat['cumulative-stats'].uploadedBytes;
  maindata.allTimeDownload = sessionStat['cumulative-stats'].downloadedBytes;
  maindata.uploadSpeed = sessionStat.uploadSpeed;
  maindata.downloadSpeed = sessionStat.downloadSpeed;
  return maindata;
};

exports.getFiles = async (clientUrl, cookie, id) => {
  const message = {
    method: 'POST',
    url: clientUrl + '/transmission/rpc',
    headers: {
      Authorization: cookie.basic,
      'X-Transmission-Session-Id': cookie.sessionId
    },
    form: JSON.stringify({
      method: 'torrent-get',
      arguments: {
        fields:
        [
          'files'
        ],
        ids: +id
      },
      tag: ''
    })
  };
  const res = await util.requestPromise(message);
  const files = JSON.parse(res.body).arguments.torrents[0].files.map(item => { return { name: item.name, size: item.length }; });
  return files;
};
