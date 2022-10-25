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
    if (doubanSet.enable) {
      global.runningDouban[id] = new Douban(doubanSet);
    }
    return '添加豆瓣成功';
  };

  delete (options) {
    if (global.runningDouban[options.id]) {
      global.runningDouban[options.id].destroy();
    }
    fs.unlinkSync(path.join(__dirname, '../data/douban/', options.id + '.json'));
    try {
      fs.unlinkSync(path.join(__dirname, '../data/douban/set', options.id + '.json'));
    } catch (e) {
      logger.error('删除豆瓣 set 报错:\n', e);
    }
    return '删除豆瓣成功';
  };

  modify (options) {
    const doubanSet = { ...options };
    if (global.runningDouban[doubanSet.id]) {
      global.runningDouban[doubanSet.id].destroy();
    }
    if (doubanSet.enable) {
      global.runningDouban[doubanSet.id] = new Douban(doubanSet);
    }
    fs.writeFileSync(path.join(__dirname, '../data/douban/', doubanSet.id + '.json'), JSON.stringify(doubanSet, null, 2));
    return '修改豆瓣成功';
  };

  list () {
    const doubanList = util.listDouban();
    return doubanList;
  };

  listWishes (options) {
    const index = options.length * (options.page - 1);
    const doubanList = util.listDouban();
    let doubanSet = util.listDoubanSet()
      .map(item => item.wishes
        .map(i => {
          return {
            ...i,
            doubanId: item.id,
            doubanAlias: doubanList.filter(ii => ii.id === item.id)[0].alias
          };
        })
      ).flat().reverse();
    if (options.downloaded) {
      doubanSet = doubanSet.filter(item => item.downloaded === (options.downloaded === 'true'));
    }
    doubanSet.sort((a, b) => a.downloaded ? 1 : -1);
    if (options.key) {
      doubanSet = doubanSet.filter(item => item.name.includes(options.key));
    }
    return {
      wishes: doubanSet.slice(index, index + +options.length) || [],
      total: doubanSet.length
    };
  };

  getWish (options) {
    const doubanList = util.listDouban();
    const doubanSetList = util.listDoubanSet();
    const wish = doubanSetList.filter(item => item.id === options.doubanId)[0].wishes.filter(item => item.id === options.wishId)[0];
    wish.doubanAlias = doubanList.filter(item => item.id === options.doubanId)[0].alias;
    wish.doubanId = options.doubanId;
    return wish;
  };

  async deleteWish (options) {
    if (!global.runningDouban[options.douban]) {
      throw new Error('豆瓣账号未启用');
    }
    if (await global.runningDouban[options.douban].deleteWish(options.id)) {
      return '删除想看项目成功';
    } else {
      return '删除失败, 项目不存在?';
    }
  }

  editWish (options) {
    logger.info(global.runningDouban);
    if (!global.runningDouban[options.doubanId]) {
      throw new Error('豆瓣账号未启用');
    }
    if (global.runningDouban[options.doubanId].updateWish(options)) {
      return '修改想看项目成功';
    } else {
      return '修改失败, 项目不存在?';
    }
  }

  refreshWish (options) {
    if (!global.runningDouban[options.douban]) {
      throw new Error('豆瓣账号未启用');
    }
    global.runningDouban[options.douban].refreshWish(options.id, true);
    return '已启动刷新任务';
  }

  async search (options) {
    if (!global.runningDouban[options.douban]) {
      throw new Error('豆瓣账号未启用');
    }
    return await global.runningDouban[options.douban].search(options.keyword);
  }

  async addWish (options) {
    if (!global.runningDouban[options.douban]) {
      throw new Error('豆瓣账号未启用');
    }
    return await global.runningDouban[options.douban].addWish(options.id, options.tag);
  }

  async listHistory (options) {
    const index = options.length * (options.page - 1);
    const params = [options.length, index];
    const history = await util.getRecords('select record_note, id, record_type, record_time from torrents where record_type in (6, 99) and record_note != \'种子推送\' order by id desc limit ? offset ?', params);
    const total = (await util.getRecord('select count(*) as total from torrents where record_type in (6, 99) and record_note != \'种子推送\'')).total;
    return {
      history: history.map(item => { return { ...JSON.parse(item.record_note), id: item.id, recordTime: item.record_time, recordType: item.record_type }; }),
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

  async refreshWishes (options) {
    global.runningDouban[options.id].refreshWishList();
    return '已启动刷新豆瓣任务, 稍后将接收到通知';
  }

  async relink (options) {
    if (!global.runningDouban[options.doubanId]) {
      throw new Error('豆瓣账号已不存在, 无法重新链接');
    }
    global.runningDouban[options.doubanId].relink(options.id);
    return '重新连接操作已执行';
  }
}

module.exports = DoubanMod;
