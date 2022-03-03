const fs = require('fs');
const path = require('path');

const util = require('../libs/util');
class LinkRuleMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const linkRuleSet = {
      id
    };
    for (const key of Object.keys(options)) {
      if (options[key] && options[key] !== '') {
        linkRuleSet[key] = options[key];
      }
    }
    fs.writeFileSync(path.join(__dirname, '../data/rule/link/', id + '.json'), JSON.stringify(linkRuleSet, null, 2));
    return '添加规则成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/rule/link/', options.id + '.json'));
    return '删除规则成功';
  };

  modify (options) {
    const linkRuleSet = {};
    for (const key of Object.keys(options)) {
      if (options[key] && options[key] !== '') {
        linkRuleSet[key] = options[key];
      }
    }
    fs.writeFileSync(path.join(__dirname, '../data/rule/link/', options.id + '.json'), JSON.stringify(linkRuleSet, null, 2));
    return '修改规则成功';
  };

  list () {
    const linkRuleList = util.listLinkRule();
    const linkList = util.listRace();
    for (const linkRule of linkRuleList) {
      linkRule.used = linkList.some(item => item.linkRules.indexOf(linkRule.id) !== -1);
    }
    return linkRuleList;
  };
}

module.exports = LinkRuleMod;
