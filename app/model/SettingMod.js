const fs = require('fs');
const path = require('path');

const settingPath = path.join(__dirname, '../data/setting.json');

class SettingMod {
  get () {
    const settingStr = fs.readFileSync(settingPath, { encoding: 'utf-8' });
    return JSON.parse(settingStr);
  };

  getBackground () {
    const settingStr = fs.readFileSync(settingPath, { encoding: 'utf-8' });
    return JSON.parse(settingStr).background;
  };

  modify (options) {
    fs.writeFileSync(path.join(__dirname, '../data/setting.json'), JSON.stringify(options, null, 2));
    return '修改全局设置成功, 刷新页面后更新。';
  };
}

module.exports = SettingMod;
