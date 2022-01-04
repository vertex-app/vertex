const fs = require('fs');
const path = require('path');

const util = require('../libs/util');
class RssRuleMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const rssRuleSet = {
      id
    };
    for (const key of Object.keys(options)) {
      if (options[key] && options[key] !== '') {
        rssRuleSet[key] = options[key];
      }
    }
    fs.writeFileSync(path.join(__dirname, '../data/rule/rss/', id + '.json'), JSON.stringify(rssRuleSet, null, 2));
    return '添加 Rss 规则成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/rule/rss/', options.id + '.json'));
    return '删除规则成功';
  };

  modify (options) {
    const rssRuleSet = {};
    for (const key of Object.keys(options)) {
      if (options[key] && options[key] !== '') {
        rssRuleSet[key] = options[key];
      }
    }
    fs.writeFileSync(path.join(__dirname, '../data/rule/rss/', options.id + '.json'), JSON.stringify(rssRuleSet, null, 2));
    return '修改 Rss 规则成功';
  };

  list () {
    const rssRuleList = util.listRssRule();
    const rssList = util.listRss();
    for (const rssRule of rssRuleList) {
      rssRule.used = rssList.some(item => item.rssRules.indexOf(rssRule.id) !== -1);
    }
    return rssRuleList;
  };
}

module.exports = RssRuleMod;
