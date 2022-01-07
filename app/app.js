const express = require('express');
const app = express();
const router = express.Router();

const logger = require('./libs/logger');
const util = require('./libs/util');
const config = require('./libs/config');
logger.use(app);

require('./routes/router.js')(app, express, router);

const init = function () {
  global.runningClient = {};
  for (const client of util.listClient()) {
    if (client.enable) {
      const Client = require('./common/Client');
      global.runningClient[client.id] = new Client(client);
    }
  }
  global.runningRss = {};
  for (const rss of util.listRss()) {
    if (rss.enable) {
      const Rss = require('./common/Rss');
      global.runningRss[rss.id] = new Rss(rss);
    }
  }
};

(async () => {
  global.CONFIG = config;
  global.LOGGER = logger;
  init();
  app.listen(process.env.PORT, () => {
    logger.info('Server started, listening', process.env.PORT);
  });
})();
