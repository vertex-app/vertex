const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const files = fs.readdirSync(__dirname);
module.exports = {
  getInfoWrapper: {},
  searchTorrentWrapper: {},
  getDownloadLinkWrapper: {},
  torrentDownloadLinkMap: {},
  siteUrlMap: {},
  siteIdMap: {}
};
for (const file of files) {
  if (path.extname(file) === '.js' && file !== 'index.js') {
    const Site = require(path.join(__dirname, file));
    try {
      const site = new Site();
      module.exports.getInfoWrapper[site.name] = site.getInfo;
      module.exports.searchTorrentWrapper[site.name] = site.searchTorrent;
      module.exports.getDownloadLinkWrapper[site.name] = site.getDownloadLink;
      module.exports.torrentDownloadLinkMap[site.name] = site.downloadLink;
      module.exports.siteUrlMap[site.name] = site.url;
      module.exports.siteIdMap[site.name] = site.id;
    } catch (err) {
      logger.error('Import Site File Error: ', file, '\n', err);
    }
  }
}
