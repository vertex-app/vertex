class Site {
  constructor () {
    this.name = 'ZHUQUE';
    this.url = 'https://zhuque.in/';
  };

  async getInfo () {
    const info = {};
    const _document = await this._getDocument(this.index + 'index');
    const csrf = _document.querySelector('meta[name=x-csrf-token]').content;
    const document = (await require('../util').requestPromise({
      url: this.index + 'api/user/getInfo',
      headers: {
        cookie: this.cookie,
        'x-csrf-token': csrf
      }
    })).body;
    const _info = JSON.parse(document).data;
    // 用户名
    info.username = _info.username;
    // uid
    info.uid = _info.id;
    // 上传
    info.upload = _info.upload;
    // 下载
    info.download = _info.download;
    // 做种
    info.seeding = _info.seeding;
    // 下载
    info.leeching = _info.leeching;
    // 做种体积
    info.seedingSize = 0;
    return info;
  };
};
module.exports = Site;
