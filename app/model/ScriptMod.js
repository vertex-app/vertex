const fs = require('fs');
const path = require('path');
const logger = require('../libs/logger');
const Script = require('../common/Script');

const util = require('../libs/util');
class ScriptMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const scriptSet = { ...options };
    scriptSet.id = id;
    fs.writeFileSync(path.join(__dirname, '../data/script/', id + '.json'), JSON.stringify(scriptSet, null, 2));
    if (global.runningScript[id]) global.runningScript[id].destroy();
    if (scriptSet.enable) global.runningScript[id] = new Script(scriptSet);
    return '添加 Script 成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/script/', options.id + '.json'));
    if (global.runningScript[options.id]) global.runningScript[options.id].destroy();
    return '删除 Script 成功';
  };

  modify (options) {
    const scriptSet = { ...options };
    fs.writeFileSync(path.join(__dirname, '../data/script/', options.id + '.json'), JSON.stringify(scriptSet, null, 2));
    if (global.runningScript[options.id]) global.runningScript[options.id].destroy();
    if (scriptSet.enable) global.runningScript[options.id] = new Script(scriptSet);
    return '修改 Script 成功';
  };

  list () {
    const scriptList = util.listCrontabJavaScript();
    return scriptList;
  };

  run (options) {
    (async () => {
      try {
        // eslint-disable-next-line no-eval
        const f = eval(options.script);
        await f();
      } catch (e) {
        logger.error(e);
      }
    })();
  }
}

module.exports = ScriptMod;
