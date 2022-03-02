const fs = require('fs');
const path = require('path');
const Douban = require('../common/Douban');

const util = require('../libs/util');
class DoubanMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const doubanSet = { ...options };
    doubanSet.id = id;
    fs.writeFileSync(path.join(__dirname, '../data/douban/', id + '.json'), JSON.stringify(doubanSet, null, 2));
    global.runningDouban[id] = new Douban(doubanSet);
    return '添加豆瓣成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/douban/', options.id + '.json'));
    global.runningDouban[options.id].destroy();
    return '删除豆瓣成功';
  };

  modify (options) {
    const doubanSet = { ...options };
    global.runningDouban[options.id].destroy();
    global.runningDouban[options.id] = new Douban(doubanSet);
    fs.writeFileSync(path.join(__dirname, '../data/douban/', options.id + '.json'), JSON.stringify(doubanSet, null, 2));
    return '修改豆瓣成功';
  };

  list () {
    const doubanList = util.listDouban();
    return doubanList;
  };
}

module.exports = DoubanMod;
