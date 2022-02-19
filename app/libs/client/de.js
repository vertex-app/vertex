const util = require('../util');

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

exports.addTorrent = async function (clientUrl, cookie, torrentUrl, isSkipChecking, uploadLimit, downloadLimit, savePath, label) {
  let message = {
    method: 'POST',
    url: clientUrl + '/json',
    json: true,
    gzip: true,
    body: {
      id: 0,
      method: 'web.download_torrent_from_url',
      params: [
        torrentUrl,
        ''
      ]
    },
    headers: {
      cookie
    }
  };
  let res = await util.requestPromise(message);
  const torrentPath = res.body.result;
  message = {
    method: 'POST',
    url: clientUrl + '/json',
    json: true,
    gzip: true,
    body: {
      id: 0,
      method: 'web.add_torrents',
      params: [
        [
          {
            path: torrentPath,
            options: {
              file_priorities: [
                1
              ],
              add_paused: false,
              sequential_download: false,
              pre_allocate_storage: false,
              move_completed: false,
              max_connections: -1,
              max_download_speed: downloadLimit,
              max_upload_slots: -1,
              max_upload_speed: uploadLimit,
              prioritize_first_last_pieces: false,
              seed_mode: isSkipChecking,
              super_seeding: false
            }
          }
        ]
      ]
    },
    headers: {
      cookie
    }
  };
  if (savePath) {
    message.body.params[0][0].options.download_location = savePath;
  }
  if (label) {
    message.body.params[0][0].options.label = label;
  }
  res = await util.requestPromise(message);
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

exports.deleteTorrent = async function (clientUrl, cookie, hash, isDeleteFiles) {
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
