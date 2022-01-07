const util = require('../libs/util');

const auth = require('../libs/config').getAuthConfig();

class UserMod {
  login (options) {
    if (options.username !== auth.username) {
      throw '用户名错误';
    }
    if (util.md5(options.password) !== auth.password) {
      throw '密码错误';
    }
    return options.username;
  };
}

module.exports = UserMod;
