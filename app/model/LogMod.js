const { execSync } = require('child_process');
const path = require('path');

class LogMod {
  get (options) {
    const logFile = path.join(__dirname, `../../logs/app-${options.type}.log`);
    const log = execSync(`tail -n 2000 ${logFile}`).toString();
    return log;
  };
}

module.exports = LogMod;
