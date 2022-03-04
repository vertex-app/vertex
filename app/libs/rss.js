const parser = require('xml2js').parseString;
const crypto = require('crypto');
const moment = require('moment');
const bencode = require('bencode');
const util = require('./util');
const redis = require('./redis');

const parseXml = util.promisify(parser);

const _getSum = function (a, b) {
  return a + b;
};

const _getRssContent = async function (rssUrl) {
  let body;
  const cache = await redis.get(`vertex:rss:${rssUrl}`);
  if (cache) {
    body = cache;
  } else {
    const res = await util.requestPromise(rssUrl + '&____=' + Math.random());
    body = res.body;
    await redis.setWithExpire(`vertex:rss:${rssUrl}`, body, 60);
  }
  return body;
};

const _getTorrents = async function (rssUrl) {
  const rss = await parseXml(await _getRssContent(rssUrl));
  const torrents = [];
  const items = rss.rss.channel[0].item;
  for (let i = 0; i < items.length; ++i) {
    const torrent = {
      size: 0,
      name: '',
      hash: '',
      id: 0,
      url: '',
      link: ''
    };
    torrent.size = items[i].enclosure[0].$.length;
    torrent.name = items[i].title[0];
    const link = items[i].link[0];
    torrent.link = link;
    torrent.id = link.substring(link.indexOf('?id=') + 4);
    torrent.url = items[i].enclosure[0].$.url;
    torrent.hash = items[i].guid[0]._ || items[i].guid[0];
    if (torrent.url.indexOf('chdbits') !== -1) {
      const cache = await redis.get(`vertex:hash:${torrent.url}`);
      if (cache) {
        torrent.hash = cache;
      } else {
        const { hash } = await exports.getTorrentNameByBencode(torrent.url);
        torrent.hash = hash;
        await redis.set(`vertex:hash:${torrent.url}`, hash);
      }
    }
    torrent.pubTime = moment(items[i].pubDate[0]).unix();
    torrents.push(torrent);
  }
  return torrents;
};

const _getTorrentsFileList = async function (rssUrl) {
  const rss = await parseXml(await _getRssContent(rssUrl));
  const torrents = [];
  const items = rss.rss.channel[0].item;
  for (let i = 0; i < items.length; ++i) {
    const torrent = {
      size: 0,
      name: '',
      hash: '',
      id: 0,
      url: '',
      link: ''
    };
    const size = items[i].description[0].match(/Size: (\d*\.\d*|\d*) (GB|MB|TB|KB)/)[0];
    const map = {
      KB: 1000,
      MB: 1000 * 1000,
      GB: 1000 * 1000 * 1000,
      TB: 1000 * 1000 * 1000 * 1000
    };
    const regRes = size.match(/Size: (\d*\.\d*|\d*) (GB|MB|TB|KB)/);
    torrent.size = parseFloat(regRes[1]) * map[regRes[2]];
    torrent.name = items[i].title[0].split('\n')[0];
    const link = items[i].link[0].match(/https:\/\/filelist.io\/download\.php\?id=\d*/)[0].replace('download', 'detailes');
    torrent.link = link;
    torrent.id = link.substring(link.indexOf('?id=') + 4);
    torrent.hash = 'fakehash' + torrent.id + 'fakehash';
    torrent.url = items[i].link[0];
    torrents.push(torrent);
  }
  return torrents;
};

const _getTorrentsBluTopia = async function (rssUrl) {
  const rss = await parseXml(await _getRssContent(rssUrl));
  const torrents = [];
  const items = rss.rss.channel[0].item;
  for (let i = 0; i < items.length; ++i) {
    const torrent = {
      size: 0,
      name: '',
      hash: '',
      id: 0,
      url: '',
      link: ''
    };
    const size = items[i].description[0].match(/Size<\/strong>: (\d*\.\d*|\d*) (GiB|MiB|TiB|KiB)/)[0];
    const map = {
      KiB: 1024,
      MiB: 1024 * 1024,
      GiB: 1024 * 1024 * 1024,
      TiB: 1024 * 1024 * 1024 * 1024
    };
    const regRes = size.match(/Size<\/strong>: (\d*\.\d*|\d*) (GiB|MiB|TiB|KiB)/);
    torrent.size = parseFloat(regRes[1]) * map[regRes[2]];
    torrent.name = items[i].title[0];
    const link = items[i].link[0];
    torrent.link = link;
    torrent.id = link.match(/torrents\/(\d*)/)[1];
    torrent.hash = 'fakehash' + torrent.id + 'fakehash';
    torrent.url = items[i].enclosure[0].$.url;
    torrents.push(torrent);
  }
  return torrents;
};

const _getTorrentsTorrentDB = async function (rssUrl) {
  const rss = await parseXml(await _getRssContent(rssUrl));
  const torrents = [];
  const items = rss.rss.channel[0].item;
  for (let i = 0; i < items.length; ++i) {
    const torrent = {
      size: 0,
      name: '',
      hash: '',
      id: 0,
      url: '',
      link: ''
    };
    const size = items[i].description[0].match(/(\d*\.\d*|\d*) (GB|MB|TB|KB)/)[0];
    const map = {
      KB: 1000,
      MB: 1000 * 1000,
      GB: 1000 * 1000 * 1000,
      TB: 1000 * 1000 * 1000 * 1000
    };
    const regRes = size.match(/(\d*\.\d*|\d*) (GB|MB|TB|KB)/);
    torrent.size = parseFloat(regRes[1]) * map[regRes[2]];
    torrent.name = items[i].title[0];
    const link = items[i].comments[0];
    torrent.link = link;
    torrent.hash = items[i].guid[0];
    torrent.url = items[i].persistentlink[0];
    torrents.push(torrent);
  }
  return torrents;
};

const _getTorrentsUHDBits = async function (rssUrl) {
  const rss = await parseXml(await _getRssContent(rssUrl));
  const torrents = [];
  const items = rss.rss.channel[0].item;
  for (let i = 0; i < items.length; ++i) {
    const torrent = {
      size: 0,
      name: '',
      hash: '',
      id: 0,
      url: '',
      link: ''
    };
    torrent.name = items[i].title[0];
    const link = items[i].comments[0];
    torrent.link = link;
    torrent.url = items[i].link[0];
    torrent.id = +torrent.url.match(/id=(\d+)/)[1];
    const cache = await redis.get(`vertex:hash:${torrent.url}`);
    if (cache) {
      const _torrent = JSON.parse(cache);
      torrent.hash = _torrent.hash;
      torrent.size = _torrent.size;
    } else {
      const { hash, size } = await exports.getTorrentNameByBencode(torrent.url);
      torrent.hash = hash;
      torrent.size = size;
      await redis.set(`vertex:hash:${torrent.url}`, JSON.stringify(torrent));
    }
    torrents.push(torrent);
  }
  return torrents;
};

const _getTorrentsEmpornium = async function (rssUrl) {
  const rss = await parseXml(await _getRssContent(rssUrl));
  const torrents = [];
  const items = rss.rss.channel[0].item;
  for (let i = 0; i < items.length; ++i) {
    const torrent = {
      size: 0,
      name: '',
      hash: '',
      id: 0,
      url: '',
      link: ''
    };
    torrent.name = items[i].title[0];
    const link = items[i].link[0];
    torrent.link = link;
    torrent.id = link.substring(link.indexOf('?id=') + 4);
    torrent.url = items[i].enclosure[0].$.url;
    const cache = await redis.get(`vertex:hash:${torrent.url}`);
    if (cache) {
      const _torrent = JSON.parse(cache);
      torrent.hash = _torrent.hash;
      torrent.size = _torrent.size;
    } else {
      const { hash, size } = await exports.getTorrentNameByBencode(torrent.url);
      torrent.hash = hash;
      torrent.size = size;
      await redis.set(`vertex:hash:${torrent.url}`, JSON.stringify(torrent));
    }
    torrent.pubTime = moment(items[i].pubDate[0]).unix();
    torrents.push(torrent);
  }
  return torrents;
};

const _getTorrentsSkyeySnow = async function (rssUrl) {
  const rss = await parseXml(await _getRssContent(rssUrl));
  const torrents = [];
  const items = rss.rss.channel[0].item;
  for (let i = 0; i < items.length; ++i) {
    const torrent = {
      size: 0,
      name: '',
      hash: '',
      id: 0,
      url: '',
      link: ''
    };
    torrent.size = items[i].enclosure[0].$.length;
    torrent.name = items[i].title[0];
    const link = items[i].link[0];
    torrent.link = link;
    torrent.id = link.substring(link.indexOf('?id=') + 4);
    torrent.url = items[i].enclosure[0].$.url;
    if (torrent.url.indexOf('skyey') !== -1) {
      const cache = await redis.get(`vertex:hash:${torrent.url}`);
      if (cache) {
        torrent.hash = cache;
      } else {
        const { hash } = await exports.getTorrentNameByBencode(torrent.url);
        torrent.hash = hash;
        await redis.set(`vertex:hash:${torrent.url}`, hash);
      }
    }
    torrent.pubTime = moment(items[i].pubDate[0]).unix();
    torrents.push(torrent);
  }
  return torrents;
};

const _getTorrentsHDBits = async function (rssUrl) {
  const rss = await parseXml(await _getRssContent(rssUrl));
  const torrents = [];
  const items = rss.rss.channel[0].item;
  for (let i = 0; i < items.length; ++i) {
    const torrent = {
      size: 0,
      name: '',
      hash: '',
      id: 0,
      url: '',
      link: ''
    };
    torrent.name = items[i].title[0];
    const link = items[i].link[0];
    torrent.id = link.match(/id=(\d+)/)[1];
    torrent.url = link;
    if (torrent.url.indexOf('hdbits') !== -1) {
      const cache = await redis.get(`vertex:hash:${torrent.url}`);
      if (cache) {
        torrent.hash = cache;
      } else {
        const { hash, size } = await exports.getTorrentNameByBencode(torrent.url);
        torrent.size = size;
        torrent.hash = hash;
        await redis.set(`vertex:hash:${torrent.url}`, hash);
      }
    }
    torrent.pubTime = moment(items[i].pubDate[0]).unix();
    torrents.push(torrent);
  }
  return torrents;
};

const _getTorrentsWrapper = {
  'filelist.io': _getTorrentsFileList,
  'blutopia.xyz': _getTorrentsBluTopia,
  'torrentdb.net': _getTorrentsTorrentDB,
  'uhdbits.org': _getTorrentsUHDBits,
  'www.empornium.is': _getTorrentsEmpornium,
  'www.skyey2.com': _getTorrentsSkyeySnow,
  'hdbits.org': _getTorrentsHDBits
};

exports.getTorrents = async function (rssUrl) {
  const host = new URL(rssUrl).host;
  if (_getTorrentsWrapper[host]) {
    return await _getTorrentsWrapper[host](rssUrl);
  }
  return await _getTorrents(rssUrl);
};

exports.getTorrentName = async function (url) {
  const res = await util.requestPromise({
    url: url,
    method: 'HEAD'
  });
  const dis = res.headers['content-disposition'];
  const filename = dis.substring(dis.indexOf('filename=') + 9);
  return decodeURIComponent(filename);
};

exports.getTorrentNameByBencode = async function (url) {
  const res = await util.requestPromise({
    url: url,
    method: 'GET',
    encoding: null
  });
  const buffer = Buffer.from(res.body, 'utf-8');
  const torrent = bencode.decode(buffer);
  const size = torrent.info.length || torrent.info.files.map(i => i.length).reduce(_getSum, 0);
  const fsHash = crypto.createHash('sha1');
  fsHash.update(bencode.encode(torrent.info));
  const md5 = fsHash.digest('md5');
  let hash = '';
  for (const v of md5) {
    hash += v < 16 ? '0' + v.toString(16) : v.toString(16);
  }
  return {
    hash,
    size,
    name: torrent.info.name.toString()
  };
};
