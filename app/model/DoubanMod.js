const fs = require('fs');
const path = require('path');
const Douban = require('../common/Douban');
const logger = require('../libs/logger');

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
    try {
      fs.unlinkSync(path.join(__dirname, '../data/douban/set', options.id + '.json'));
    } catch (e) {
      logger.error('删除豆瓣 set 报错:\n', e);
    }
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

  listWishes () {
    const doubanSet = util.listDoubanSet().map(item => item.wishes.map(i => { return { ...i, doubanId: item.id }; })).flat();
    return doubanSet || [];
  };

  deleteItem (options) {
    const doubanSet = util.listDoubanSet().filter(item => item.id === options.id)[0];
    doubanSet.wishes = doubanSet.wishes.filter(item => item.id !== options.doubanId);
    global.runningDouban[options.id].wishes = doubanSet.wishes;
    fs.writeFileSync(path.join(__dirname, '../data/douban/set', options.id + '.json'), JSON.stringify(doubanSet, null, 2));
    return '删除想看记录成功';
  }

  async refreshWishes (options) {
    await global.runningDouban[options.id].refreshWish();
    return '刷新想看列表成功';
  }
}

module.exports = DoubanMod;
