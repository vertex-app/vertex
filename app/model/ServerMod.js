const logger = require('../libs/logger');
const exec = require('../libs/exec');

class ServerMod {
  async netSpeed () {
    try {
      return await exec.getNetSpeed();
    } catch (e) {
      logger.error(e);
      throw e.message;
    }
  };

  async cpuUse () {
    try {
      return await exec.getCpuUse();
    } catch (e) {
      logger.error(e);
      throw e.message;
    }
  };

  async diskUse () {
    try {
      return await exec.getDiskUse();
    } catch (e) {
      logger.error(e);
      throw e.message;
    }
  };

  async memoryUse () {
    try {
      return await exec.getMemoryUse();
    } catch (e) {
      logger.error(e);
      throw e.message;
    }
  };

  async vnstat () {
    try {
      return {
        fiveminute: await exec.getVnstat5(),
        hour: await exec.getVnstatHour(),
        day: await exec.getVnstatDay(),
        month: await exec.getVnstatMonth()
      };
    } catch (e) {
      logger.error(e);
      throw e.message;
    }
  }
}

module.exports = ServerMod;
