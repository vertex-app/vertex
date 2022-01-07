const util = require('./util');
const moment = require('moment');

exports.reannounceErrorString = function (clientAlias, torrentName, tracker, message) {
  let str = '';
  str += '#Error\n';
  str += '<pre>Reannounce Torrent Error:</pre>\n';
  str += `<pre> Client: ${clientAlias}</pre>\n`;
  str += `<pre> Torrent: ${torrentName}</pre>\n`;
  str += `<pre> Tracker: ${tracker}</pre>\n`;
  str += `<pre> Message: ${message}</pre>`;
  return str;
};

exports.deleteTorrentErrorString = function (clientAlias, torrentName, reason) {
  let str = '';
  str += '#Error\n';
  str += '<pre>Add Torrent Error:</pre>\n';
  str += `<pre> Client: ${clientAlias}</pre>\n`;
  str += `<pre> Torrent: ${torrentName}</pre>\n`;
  str += `<pre> Reason: ${reason}</pre>`;
  return str;
};

exports.deleteTorrentString = function (clientAlias, torrentName, size, ud, udSpeed, ratio, tracker, isDeleteFiles, note) {
  let str = '';
  str += '#Delete\n';
  str += '<pre>Delete Torrent:</pre>\n';
  str += `<pre> Client: ${clientAlias}</pre>\n`;
  str += `<pre> Torrent: ${torrentName}</pre>\n`;
  str += `<pre> Size: ${util.formatSize(size)}</pre>\n`;
  str += `<pre> ↑/↓: ${ud}</pre>\n`;
  str += `<pre> ↑/↓: ${udSpeed}</pre>\n`;
  str += `<pre> Ratio: ${(+ratio).toFixed(3)}</pre>\n`;
  str += `<pre> Tracker: ${tracker}</pre>\n`;
  str += `<pre> IsDeleteFile: ${isDeleteFiles}</pre>\n`;
  str += `<pre> Note: ${note}</pre>\n`;
  return str;
};

exports.ioString = function (taskName, clientAlias, torrentName, size, ud, ratio, tracker, note) {
  let str = '';
  str += '#IO\n';
  str += '<pre>Delete Torrent:</pre>\n';
  str += `<pre> TaskName: ${taskName}</pre>\n`;
  str += `<pre> Client: ${clientAlias}</pre>\n`;
  str += `<pre> Torrent: ${torrentName}</pre>\n`;
  str += `<pre> Size: ${size}</pre>\n`;
  str += `<pre> ↑/↓: ${ud}</pre>\n`;
  str += `<pre> Ratio: ${(+ratio).toFixed(3)}</pre>\n`;
  str += `<pre> Tracker: ${tracker}</pre>\n`;
  str += `<pre> Note: ${note}</pre>\n`;
  return str;
};

exports.rssErrorString = function (taskName, message) {
  let str = '';
  str += '#Error\n';
  str += '<pre>Get Rss Error:</pre>\n';
  str += `<pre> TaskName: ${taskName}</pre>\n`;
  str += `<pre> Message: ${message}</pre>`;
  return str;
};

exports.scrapeErrorString = function (taskName, torrentName, message) {
  let str = '';
  str += '#Error\n';
  str += '<pre>Scrape Torrent Error:</pre>\n';
  str += `<pre> TaskName: ${taskName}</pre>\n`;
  str += `<pre> Torrent: ${torrentName}</pre>\n`;
  str += `<pre> Message: ${message}</pre>`;
  return str;
};

exports.rejectString = function (taskName, torrentName, size, reason) {
  let str = '';
  str += '#Reject\n';
  str += '<pre>Rss Reject: </pre>\n';
  str += `<pre> TaskName: ${taskName}</pre>\n`;
  str += `<pre> Torrent: ${torrentName}</pre>\n`;
  str += `<pre> Size: ${size}</pre>\n`;
  str += `<pre> Reason: ${reason}</pre>`;
  return str;
};

exports.addTorrentErrorString = function (taskName, torrentName, size, reason) {
  let str = '';
  str += '#Error\n';
  str += '<pre>Add Torrent Error:</pre>\n';
  str += `<pre> TaskName: ${taskName}</pre>\n`;
  str += `<pre> Torrent: ${torrentName}</pre>\n`;
  str += `<pre> Size: ${util.formatSize(size)}</pre>\n`;
  str += `<pre> Reason: ${reason}</pre>`;
  return str;
};

exports.addTorrentString = function (isSkipChecking, taskName, clientAlias, torrentName, size, torrentReseedName, rule) {
  let str = '';
  str += `#${isSkipChecking ? 'Reseed' : 'Add'}\n`;
  str += '<pre>Add Torrent:</pre>\n';
  str += `<pre> TaskName: ${taskName}</pre>\n`;
  str += `<pre> Client: ${clientAlias}</pre>\n`;
  str += `<pre> Torrent: ${torrentName}</pre>\n`;
  str += `<pre> Size: ${size}</pre>\n`;
  if (isSkipChecking) {
    str += '<pre> Remark: SkipChecking</pre>\n';
    str += `<pre> TorrentReseed: ${torrentReseedName}</pre>\n`;
  }
  if (rule) {
    str += `<pre> Fit rule: ${rule.alias}</pre>\n`;
  }
  return str;
};

exports.getMaindataErrorString = function (clientAlias, message) {
  let str = '';
  str += '#Error\n';
  str += '<pre>Get Maindata Error:</pre>\n';
  str += `<pre> Client: ${clientAlias}</pre>\n`;
  str += `<pre> Message: ${message}</pre>`;
  return str;
};

exports.getCookieErrorString = function (clientAlias, message) {
  let str = '';
  str += '#Error\n';
  str += '<pre>Get Cookie Error:</pre>\n';
  str += `<pre> Client: ${clientAlias}</pre>\n`;
  str += `<pre> Message: ${message}</pre>`;
  return str;
};

exports.connectClientString = function (clientAlias, time) {
  let str = '';
  str += '<pre>Client Connected: \n';
  str += `Alias: ${clientAlias}\n`;
  str += `Time: ${time}</pre>`;
  return str;
};

exports.clientInfoString = function (maindata, serverSpeed) {
  const torrents = maindata.torrents.sort((a, b) => b.uploadSpeed - a.uploadSpeed || b.downloadSpeed - a.downloadSpeed).slice(0, 10);
  let message = '';
  for (let i = 0; i < 10; i++) {
    if (!torrents[i]) break;
    message += `<pre>${i + 1}:</pre>\n`;
    message += `<pre>  ${torrents[i].name.length > 20 ? torrents[i].name.substring(0, 20) + '..' : torrents[i].name}</pre>\n`;
    message += `<pre>  ↑/↓: ${util.formatSize(torrents[i].uploadSpeed)}/s / ${util.formatSize(torrents[i].downloadSpeed)}/s</pre>\n`;
    message += `<pre>  ↑/↓: ${util.formatSize(torrents[i].uploaded)} / ${util.formatSize(torrents[i].downloaded)}</pre>\n`;
    message += `<pre>  Ratio: ${torrents[i].ratio.toFixed(3)}</pre>\n`;
    message += `<pre>  Size: ${util.formatSize(torrents[i].size)}</pre>\n`;
    message += `<pre>  Progress: ${torrents[i].progress.toFixed(3)}</pre>\n`;
    message += `<pre>  Tracker: ${torrents[i].tracker}</pre>\n`;
  }
  message += '\n';
  message += `<pre>S/L: ${maindata.seedingCount} / ${maindata.leechingCount}</pre>\n`;
  message += `<pre>↑/↓: ${util.formatSize(maindata.uploadSpeed)}/s / ${util.formatSize(maindata.downloadSpeed)}/s</pre>\n`;
  message += `<pre>Server ↑/↓: ${util.formatSize(serverSpeed.uploadSpeed)}/s / ${util.formatSize(serverSpeed.downloadSpeed)}/s</pre>\n`;
  message += `<pre>Free Space: ${util.formatSize(maindata.freeSpaceOnDisk)}</pre>\n`;
  message += `<pre>Update Time: ${moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss')}</pre>`;
  return message;
};
