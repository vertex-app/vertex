const fs = require('fs');
const path = require('path');

const util = require('../libs/util');
class DeleteRuleMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const deleteRuleSet = {
      id
    };
    for (const key of Object.keys(options)) {
      if (options[key] && options[key] !== '') {
        deleteRuleSet[key] = options[key];
      }
    }
    fs.writeFileSync(path.join(__dirname, '../data/rule/delete/', id + '.json'), JSON.stringify(deleteRuleSet, null, 2));
    return '添加规则成功';
  };

  delete (options) {
  };

  modify (options) {
    const deleteRuleSet = {};
    for (const key of Object.keys(options)) {
      if (options[key] && options[key] !== '') {
        deleteRuleSet[key] = options[key];
      }
    }
    fs.writeFileSync(path.join(__dirname, '../data/rule/delete/', options.id + '.json'), JSON.stringify(deleteRuleSet, null, 2));
    return '修改规则成功';
  };

  list () {
    const deleteRuleList = util.listDeleteRule();
    return deleteRuleList;
  };
}

module.exports = DeleteRuleMod;
