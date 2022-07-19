const util = require('../libs/util');
const cron = require('node-cron');
const logger = require('../libs/logger');

class Script {
  constructor (script) {
    this.cron = script.cron;
    this.script = script.script;
    // eslint-disable-next-line no-eval
    this.job = cron.schedule(this.cron, async () => { try { eval(this.script); } catch (e) { logger.error(e); } });
  };

  destroy () {
    this.job.stop();
    delete this.job;
  }
}

module.exports = Script;
