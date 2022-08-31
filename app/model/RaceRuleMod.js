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
    fs.writeFileSync(path.join(__dirname, '../data/rule/race/', id + '.json'), JSON.stringify(raceRuleSet, null, 2));
    return '添加规则成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/rule/race/', options.id + '.json'));
    return '删除规则成功';
  };

  modify (options) {
    const raceRuleSet = {};
    for (const key of Object.keys(options)) {
      if (options[key] !== undefined && options[key] !== '') {
        raceRuleSet[key] = options[key];
      }
    }
    fs.writeFileSync(path.join(__dirname, '../data/rule/race/', options.id + '.json'), JSON.stringify(raceRuleSet, null, 2));
    return '修改规则成功';
  };

  list () {
    const raceRuleList = util.listRaceRule();
    const raceRuleSetList = util.listRaceRuleSet();
    const doubanList = util.listDouban();
    for (const raceRule of raceRuleList) {
      raceRule.used = !!doubanList.some(item => item.raceRules.concat(item => item.rejectRules).indexOf(raceRule.id) !== -1) ||
        !!raceRuleSetList.some(item => item.raceRules.indexOf(raceRule.id) !== -1);
    }
    return raceRuleList;
  };
}

module.exports = RaceRuleMod;
