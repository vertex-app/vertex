class UserMod {
  login (options) {
    if (options.username !== global.auth.username) {
      throw new Error('用户名错误');
    }
    if (options.password !== global.auth.password) {
      throw new Error('密码错误');
    }
    return options.username;
  };
}

module.exports = UserMod;
