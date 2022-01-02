const fs = require('fs');
const path = require('path');
const logger = require('../libs/logger');

const files = fs.readdirSync(__dirname);
for (const file of files) {
  if (path.extname(file) === '.js' && file !== 'index.js') {
    const Ctrl = require(path.join(__dirname, file));
    try {
      module.exports[file.split('.')[0]] = new Ctrl();
    } catch (err) {
      logger.error('Import Controller File Error: ', file, '\n', err);
    }
  }
}
