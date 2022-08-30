const util = require('../util');
const logger = require('../logger');
const url = require('url');
const fs = require('fs');

exports.login = async function (username, clientUrl, password) {
  const message = {
    url: clientUrl + '/api/v2/auth/login',
    method: 'POST',
    form: {
      username,
      password
    }
  };
  const res = await util.requestPromise(message);
  if (res.body.indexOf('Ok') !== -1) {
    return res.headers['set-cookie'][0].substring(0, res.headers['set-cookie'][0].indexOf(';'));
  }
  if (res.body.indexOf('Fails') !== -1) {
    throw new Error('password is wrong!');
  }
  if (res.statusCode !== 200) {
    throw new Error('StatusCode is ' + res.statusCode);
  }
};

exports.addTorrent = async function (clientUrl, cookie, torrentUrl, isSkipChecking, uploadLimit, downloadLimit, savePath, category, autoTMM, firstLastPiecePrio, paused) {
  const message = {
    url: clientUrl + '/api/v2/torrents/add',
    method: 'POST',
    headers: {
      cookie
    },
    formData: {
      urls: torrentUrl,
      skip_checking: isSkipChecking + '',
      upLimit: uploadLimit,
      dlLimit: downloadLimit,
      firstLastPiecePrio: firstLastPiecePrio + '',
      paused: paused || 'false'
    }
  };
  if (savePath) {
    message.formData.savepath = savePath;
  }
  if (category) {
    message.formData.category = category;
  }
  if (autoTMM) {
    message.formData.autoTMM = '' + autoTMM;
  }
  const res = await util.requestPromise(message);
  logger.debug(clientUrl, '添加种子', torrentUrl, '\n返回信息', { body: res.body, statusCode: res.statusCode });
  return res;
};

exports.addTorrentByTorrentFile = async function (clientUrl, cookie, filepath, isSkipChecking, uploadLimit, downloadLimit, savePath, category, autoTMM, firstLastPiecePrio, paused) {
  const message = {
    url: clientUrl + '/api/v2/torrents/add',
    method: 'POST',
    headers: {
      cookie
    },
    formData: {
      torrents: fs.createReadStream(filepath),
      skip_checking: isSkipChecking + '',
      upLimit: uploadLimit,
      dlLimit: downloadLimit,
      firstLastPiecePrio: firstLastPiecePrio + '',
      paused: paused || 'false'
    }
  };
  if (savePath) {
    message.formData.savepath = savePath;
  }
  if (category) {
    message.formData.category = category;
  }
  if (autoTMM) {
    message.formData.autoTMM = '' + autoTMM;
  }
  const res = await util.requestPromise(message);
  logger.debug(clientUrl, '添加种子', filepath, '\n返回信息', { body: res.body, statusCode: res.statusCode });
  return res;
};

exports.addTorrentTag = async function (clientUrl, cookie, hash, tag) {
  const message = {
    url: clientUrl + `/api/v2/torrents/addTags?hashes=${hash}&tags=${encodeURIComponent(tag)}`,
    headers: {
      cookie
    }
  };
  const res = await util.requestPromise(message);
  return res;
};

exports.deleteTorrent = async function (clientUrl, cookie, hash, isDeleteFiles) {
  const message = {
    url: clientUrl + `/api/v2/torrents/delete?hashes=${hash}${isDeleteFiles ? '&deleteFiles=true' : '&deleteFiles=false'}`,
    headers: {
      cookie
    }
  };
  const res = await util.requestPromise(message);
  logger.debug(clientUrl, '删除种子', hash, '删除种子文件: ', isDeleteFiles, '\n返回信息', { body: res.body, statusCode: res.statusCode });
  return res;
};

exports.reannounceTorrent = async (clientUrl, cookie, hash) => {
  const message = {
    url: clientUrl + `/api/v2/torrents/reannounce?hashes=${hash}`,
    headers: {
      cookie
    }
  };
  const res = await util.requestPromise(message);
  return res;
};

exports.getTrackerList = async (clientUrl, cookie, hash) => {
  const message = {
    url: clientUrl + `/api/v2/torrents/trackers?hash=${hash}`,
    headers: {
      cookie
    }
  };
  const res = await util.requestPromise(message);
  return res;
};

exports.getFiles = async (clientUrl, cookie, hash) => {
  const message = {
    url: clientUrl + `/api/v2/torrents/files?hash=${hash}`,
    headers: {
      cookie
    }
  };
  const res = await util.requestPromise(message);
  return JSON.parse(res.body);
};

exports.setSpeedLimit = async (clientUrl, cookie, hash, type, speed) => {
  const message = {
    url: clientUrl + `/api/v2/torrents/set${type === 'upload' ? 'Upload' : 'Download'}Limit`,
    method: 'POST',
    headers: {
      cookie
    },
    formData: {
      hashes: hash,
      limit: speed + ''
    }
  };
  const res = await util.requestPromise(message);
  return res;
};

exports.setFilePriority = async (clientUrl, cookie, hash, id, priority) => {
  const message = {
    url: clientUrl + '/api/v2/torrents/filePrio',
    method: 'POST',
    headers: {
      cookie
    },
    formData: {
      hash: hash,
      id: id,
      priority: priority
    }
  };
  const res = await util.requestPromise(message);
  return res;
};

exports.getMaindata = async function (clientUrl, cookie) {
  const option = {
    url: clientUrl + '/api/v2/sync/maindata',
    headers: {
      cookie
    }
  };
  let res = await util.requestPromise(option);
  const serverFilter = {
    allTimeUpload: 'alltime_ul',
    allTimeDownload: 'alltime_dl',
    uploadSpeed: 'up_info_speed',
    downloadSpeed: 'dl_info_speed',
    freeSpaceOnDisk: 'free_space_on_disk',
    queuedIO: 'queued_io_jobs',
    readCacheOverload: 'read_cache_overload',
    writeCacheOverload: 'write_cache_overload'
  };
  const torrentFilter = {
    availability: 'availability',
    name: 'name',
    uploadSpeed: 'upspeed',
    downloadSpeed: 'dlspeed',
    size: 'size',
    progress: 'progress',
    tracker: 'tracker',
    completed: 'completed',
    uploaded: 'uploaded',
    downloaded: 'downloaded',
    ratio: 'ratio',
    category: 'category',
    state: 'state',
    addedTime: 'added_on',
    completedTime: 'completion_on',
    savePath: 'save_path',
    seeder: 'num_seeds',
    leecher: 'num_leechs',
    totalSeeder: 'num_complete',
    totalLeecher: 'num_incomplete',
    tags: 'tags'
  };
  const maindata = {
    torrents: []
  };
  res = JSON.parse(res.body);
  for (const k in serverFilter) {
    maindata[k] = res.server_state[serverFilter[k]];
  }
  maindata.readCacheOverload = +maindata.readCacheOverload;
  maindata.writeCacheOverload = +maindata.writeCacheOverload;
  maindata.serverState = { ...res.server_state };
  for (const k in res.torrents) {
    const torrent = {};
    torrent.hash = k;
    for (const kk in torrentFilter) {
      torrent[kk] = res.torrents[k][torrentFilter[kk]];
    }
    torrent.originProp = { ...res.torrents[k] };
    torrent.tracker = torrent.tracker ? new url.URL(torrent.tracker).hostname : '';
    maindata.torrents.push(torrent);
  }
  return maindata;
};
