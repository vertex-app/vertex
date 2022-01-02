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
    return rssRuleList;
  };
}

module.exports = RssRuleMod;
