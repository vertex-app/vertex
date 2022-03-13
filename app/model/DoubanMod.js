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
    const doubanList = util.listDouban();
    const doubanSet = util.listDoubanSet()
      .map(item => item.wishes.map(i => { return { ...i, doubanId: item.id, doubanAlias: doubanList.filter(ii => ii.id === item.id)[0].alias }; }))
      .flat();
    return doubanSet || [];
  };

  async listHistory (options) {
    const index = options.length * (options.page - 1);
    const params = [options.length, index];
    const history = await util.getRecords('select record_note, id, record_type, record_time from torrents where record_type in (6, 99) order by id desc limit ? offset ?', params);
    const total = (await util.getRecord('select count(*) as total from torrents where record_type in (6, 99)')).total;
    return {
      history: history.map(item => { return { ...JSON.parse(item.record_note), id: item.id, recordTime: item.record_time, recordType: item.recordType }; }),
      total
    };
  };

  async deleteRecord (options) {
    if (!options.id) {
      throw new Error('非法请求');
    }
    await util.runRecord('delete from torrents where id = ?', [options.id]);
    return '删除成功';
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

  async relink (options) {
    if (!global.runningDouban[options.doubanId]) {
      throw new Error('豆瓣账号已不存在, 无法重新软链接');
    }
    global.runningDouban[options.doubanId].relink(options.id);
    return '重新连接操作已执行';
  }
}

module.exports = DoubanMod;
