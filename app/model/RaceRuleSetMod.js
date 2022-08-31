const fs = require('fs');
const path = require('path');

const util = require('../libs/util');
class RaceRuleMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const raceRuleSet = {
      id
    };
    for (const key of Object.keys(options)) {
      if (options[key] !== undefined && options[key] !== '') {
        raceRuleSet[key] = options[key];
      }
    }
    fs.writeFileSync(path.join(__dirname, '../data/rule/raceSet/', id + '.json'), JSON.stringify(raceRuleSet, null, 2));
    return '添加规则成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/rule/raceSet/', options.id + '.json'));
    return '删除规则成功';
  };

  modify (options) {
    const raceRuleSet = {};
    for (const key of Object.keys(options)) {
      if (options[key] !== undefined && options[key] !== '') {
        raceRuleSet[key] = options[key];
      }
    }
    fs.writeFileSync(path.join(__dirname, '../data/rule/raceSet/', options.id + '.json'), JSON.stringify(raceRuleSet, null, 2));
    return '修改规则成功';
  };

  list () {
    const raceRuleSetList = util.listRaceRuleSet();
    return raceRuleSetList;
  };
}

module.exports = RaceRuleMod;
