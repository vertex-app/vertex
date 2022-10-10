const fs = require('fs');
const path = require('path');
const Watch = require('../common/Watch');

const util = require('../libs/util');
class WatchMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const watchSet = { ...options };
    watchSet.id = id;
    fs.writeFileSync(path.join(__dirname, '../data/watch/', id + '.json'), JSON.stringify(watchSet, null, 2));
    if (global.runningWatch[id]) global.runningWatch[id].destroy();
    if (watchSet.enable) global.runningWatch[id] = new Watch(watchSet);
    return '添加 Watch 成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/watch/', options.id + '.json'));
    fs.unlinkSync(path.join(__dirname, '../data/watch/set/', options.id + '.json'));
    if (global.runningWatch[options.id]) global.runningWatch[options.id].destroy();
    return '删除 Watch 成功';
  };

  modify (options) {
    const watchSet = { ...options };
    fs.writeFileSync(path.join(__dirname, '../data/watch/', options.id + '.json'), JSON.stringify(watchSet, null, 2));
    if (global.runningWatch[options.id]) global.runningWatch[options.id].destroy();
    if (watchSet.enable) global.runningWatch[options.id] = new Watch(watchSet);
    return '修改 Watch 成功';
  };

  list () {
    const watchList = util.listWatch();
    return watchList;
  };

  listHistory () {
    const watchList = util.listWatch();
    const watchSetList = util.listWatchSet();
    const history = watchSetList.map(item => Object.keys(item.torrents)
      .map(subItem => ({
        ...item.torrents[subItem],
        hash: subItem,
        task: watchList.filter(w => w.id === item.id)[0].alias,
        taskId: item.id
      })))
      .flat()
      .reverse();
    return history;
  };

  deleteRecord (options) {
    if (!global.runningWatch[options.taskId]) {
      throw new Error('任务未启用');
    }
    global.runningWatch[options.taskId].delHistory(options.hash);
    return '删除项目成功';
  };
}

module.exports = WatchMod;
