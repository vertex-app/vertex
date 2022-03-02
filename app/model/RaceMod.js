const fs = require('fs');
const path = require('path');
const Race = require('../common/Race');

const util = require('../libs/util');
class RaceMod {
  add (options) {
    const id = util.uuid.v4().split('-')[0];
    const raceSet = { ...options };
    raceSet.id = id;
    raceSet.raceRules = raceSet.raceRules || [];
    fs.writeFileSync(path.join(__dirname, '../data/race/', id + '.json'), JSON.stringify(raceSet, null, 2));
    if (raceSet.enable) global.runningRace[id] = new Race(raceSet);
    return '添加自动追剧成功';
  };

  delete (options) {
    fs.unlinkSync(path.join(__dirname, '../data/race/', options.id + '.json'));
    if (global.runningRace[options.id]) global.runningRace[options.id].destroy();
    return '删除自动追剧成功';
  };

  modify (options) {
    const raceSet = { ...options };
    raceSet.raceRules = raceSet.raceRules || [];
    if (global.runningRace[options.id]) global.runningRace[options.id].destroy();
    if (raceSet.enable) global.runningRace[options.id] = new Race(raceSet);
    fs.writeFileSync(path.join(__dirname, '../data/race/', options.id + '.json'), JSON.stringify(raceSet, null, 2));
    return '修改自动追剧成功';
  };

  list () {
    const raceList = util.listRace();
    return raceList;
  };
}

module.exports = RaceMod;
