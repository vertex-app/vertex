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
      if (options[key] !== undefined && options[key] !== '') {
        deleteRuleSet[key] = options[key];
      }
    }
    fs.writeFileSync(path.join(__dirname, '../data/rule/delete/', id + '.json'), JSON.stringify(deleteRuleSet, null, 2));
    return '添加规则成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/rule/delete/', options.id + '.json'));
    return '删除规则成功';
  };

  modify (options) {
    const deleteRuleSet = {};
    for (const key of Object.keys(options)) {
      if (options[key] !== undefined && options[key] !== '') {
        deleteRuleSet[key] = options[key];
      }
    }
    fs.writeFileSync(path.join(__dirname, '../data/rule/delete/', options.id + '.json'), JSON.stringify(deleteRuleSet, null, 2));
    Object.keys(global.runningClient)
      .map(item => global.runningClient[item])
      .filter(item => ((item._deleteRules.some(i => i === options.id) || item._rejectDeleteRules.some(i => i === options.id)) && !!item.autoDeleteJob))
      .forEach(item => item.reloadDeleteRule());
    return '修改规则成功';
  };

  list () {
    const deleteRuleList = util.listDeleteRule();
    const clientList = util.listClient();
    for (const deleteRule of deleteRuleList) {
      deleteRule.used = clientList.some(item => (item.deleteRules.indexOf(deleteRule.id) !== -1 || (item.rejectDeleteRules || []).indexOf(deleteRule.id) !== -1));
    }
    return deleteRuleList;
  };
}

module.exports = DeleteRuleMod;
