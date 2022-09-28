const cron = require('node-cron');
const logger = require('../libs/logger');

class Script {
  constructor (script) {
    this.cron = script.cron;
    this.alias = script.alias;
    this.id = script.id;
    this.script = script.script;
    // eslint-disable-next-line no-eval
    this.job = cron.schedule(this.cron, async () => { try { const f = eval(this.script); await f(); } catch (e) { logger.error(e); } });
  };

  destroy () {
    this.job.stop();
    delete this.job;
    if (global.runningScript[this.id]) {
      delete global.runningScript[this.id];
    }
  }
}

module.exports = Script;
