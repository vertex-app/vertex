const util = require('../util');
const fs = require('fs');
const path = require('path');

exports.login = async function (username, clientUrl, password) {
  const message = {
    method: 'POST',
    url: clientUrl + '/json',
    json: true,
    gzip: true,
    body: {
      id: 0,
      method: 'auth.login',
      params: [
        password
      ]
    }
  };
  const res = await util.requestPromise(message);
  return res.headers['set-cookie'][0].substring(0, res.headers['set-cookie'][0].indexOf(';'));
};

exports.addTorrent = async function (clientUrl, cookie, torrentUrl, isSkipChecking, uploadLimit, downloadLimit, savePath, label, autoTMM, firstLastPiecePrio, paused) {
  let message = {
    method: 'POST',
    url: clientUrl + '/json',
    json: true,
    gzip: true,
    body: {
      id: 0,
      method: 'core.add_torrent_url',
      params:
        [torrentUrl,
          {
            sequential_download: false,
            pre_allocate_storage: false,
            move_completed: false,
            max_connections: -1,
            max_download_speed: downloadLimit ? (downloadLimit / 1024) : -1,
            max_upload_slots: -1,
            max_upload_speed: uploadLimit ? (uploadLimit / 1024) : -1,
            prioritize_first_last_pieces: firstLastPiecePrio,
            seed_mode: isSkipChecking,
            super_seeding: false
          }
        ]
    },
    headers: {
      cookie
    }
  };
  if (paused) {
    message.body.params[1].add_paused = paused;
  }
  if (savePath) {
    message.body.params[1].download_location = savePath;
  }
  let res = await util.requestPromise(message);
  if (label) {
    message = {
      method: 'POST',
      url: clientUrl + '/json',
      json: true,
      gzip: true,
      body: {
        method: 'label.set_torrent',
        params: [res.body.result, label],
        id: 0
      },
      headers: {
        cookie
      }
    };
    res = await util.requestPromise(message);
    if (res.body.error && (res.body.error.message.indexOf('Unknown Label') !== -1)) {
      const addLabelMessage = {
        method: 'POST',
        url: clientUrl + '/json',
        json: true,
        gzip: true,
        body: {
          method: 'label.add',
          params: [label],
          id: 0
        },
        headers: {
          cookie
        }
      };
      res = await util.requestPromise(addLabelMessage);
      res = await util.requestPromise(message);
    }
  }
  return res;
};

exports.addTorrentByTorrentFile = async function (clientUrl, cookie, filepath, isSkipChecking, uploadLimit, downloadLimit, savePath, label, autoTMM, firstLastPiecePrio, paused) {
  let message = {
    method: 'POST',
    url: clientUrl + '/json',
    json: true,
    gzip: true,
    body: {
      id: 0,
      method: 'core.add_torrent_file',
      params: [
        path.basename(filepath),
        fs.readFileSync(filepath).toString('base64'),
        {
          sequential_download: false,
          pre_allocate_storage: false,
          move_completed: false,
          max_connections: -1,
          max_download_speed: downloadLimit ? (downloadLimit / 1024) : -1,
          max_upload_slots: -1,
          max_upload_speed: uploadLimit ? (uploadLimit / 1024) : -1,
          prioritize_first_last_pieces: firstLastPiecePrio,
          seed_mode: isSkipChecking,
          super_seeding: false
        }
      ]
    },
    headers: {
      cookie
    }
  };
  if (paused) {
    message.body.params[2].add_paused = paused;
  }
  if (savePath) {
    message.body.params[2].download_location = savePath;
  }
  let res = await util.requestPromise(message);
  if (label) {
    message = {
      method: 'POST',
      url: clientUrl + '/json',
      json: true,
      gzip: true,
      body: {
        method: 'label.set_torrent',
        params: [res.body.result, label],
        id: 0
      },
      headers: {
        cookie
      }
    };
    res = await util.requestPromise(message);
    if (res.body.error && (res.body.error.message.indexOf('Unknown Label') !== -1)) {
      const addLableMessage = {
        method: 'POST',
        url: clientUrl + '/json',
        json: true,
        gzip: true,
        body: {
          method: 'label.add',
          params: [label],
          id: 0
        },
        headers: {
          cookie
        }
      };
      res = await util.requestPromise(addLableMessage);
      res = await util.requestPromise(message);
    }
  }
  return res;
};

exports.getMaindata = async function (clientUrl, cookie) {
  const option = {
    method: 'POST',
    url: clientUrl + '/json',
    headers: {
      cookie
    },
    json: true,
    gzip: true,
    body: {
      id: 0,
      method: 'web.update_ui',
      params: [
        [
          'name', 'total_wanted', 'seeding_time',
          'state', 'progress', 'ratio',
          'time_added', 'tracker_host', 'download_location',
          'total_done', 'total_uploaded', 'upload_payload_rate',
          'download_payload_rate', 'distributed_copies', 'label'
        ],
        {}
      ]
    }
  };
  let res = await util.requestPromise(option);
  const serverFilter = {
    uploadSpeed: 'upload_rate',
    downloadSpeed: 'download_rate',
    freeSpaceOnDisk: 'free_space'
  };
  const torrentFilter = {
    availability: 'distributed_copies',
    name: 'name',
    uploadSpeed: 'upload_payload_rate',
    downloadSpeed: 'download_payload_rate',
    size: 'total_wanted',
    progress: 'progress',
    tracker: 'tracker_host',
    completed: 'total_done',
    uploaded: 'total_uploaded',
    downloaded: 'total_done',
    ratio: 'ratio',
    state: 'state',
    addedTime: 'time_added',
    seedingTime: 'seeding_time',
    savePath: 'save_path',
    category: 'label'
  };
  const maindata = {
    torrents: []
  };
  res = res.body.result;
  for (const k in serverFilter) {
    maindata[k] = res.stats[serverFilter[k]];
  }
  maindata.serverState = { ...res.stats };
  for (const k in res.torrents) {
    const torrent = {};
    torrent.hash = k;
    for (const kk in torrentFilter) {
      torrent[kk] = res.torrents[k][torrentFilter[kk]];
    }
    torrent.progress = torrent.progress / 100;
    if (+torrent.progress === -1) torrent.progress = 0;
    torrent.originProp = { ...res.torrents[k] };
    torrent.completedTime = Math.max(Date.now() / 1000 - torrent.seedingTime, torrent.addedTime);
    maindata.torrents.push(torrent);
  }
  return maindata;
};

exports.reannounceTorrent = async function (clientUrl, cookie, hash) {
  const message = {
    method: 'POST',
    url: clientUrl + '/json',
    json: true,
    gzip: true,
    body: {
      id: 0,
      method: 'core.force_reannounce',
      params: [
        [hash]
      ]
    },
    headers: {
      cookie
    }
  };
  const res = await util.requestPromise(message);
  return res;
};

exports.pauseTorrent = async function (clientUrl, cookie, hash) {
  const message = {
    method: 'POST',
    url: clientUrl + '/json',
    json: true,
    gzip: true,
    body: {
      id: 0,
      method: 'core.pause_torrent',
      params: [
        [hash]
      ]
    },
    headers: {
      cookie
    }
  };
  const res = await util.requestPromise(message);
  return res;
};

exports.deleteTorrent = async function (clientUrl, cookie, hash, isDeleteFiles) {
  // Deluge删除种子不先暂停有可能会丢最后一次汇报的流量
  await exports.pauseTorrent(clientUrl, cookie, hash);
  const message = {
    method: 'POST',
    url: clientUrl + '/json',
    json: true,
    gzip: true,
    body: {
      id: 0,
      method: 'core.remove_torrent',
      params: [
        hash,
        isDeleteFiles
      ]
    },
    headers: {
      cookie
    }
  };
  const res = await util.requestPromise(message);
  return res;
};
