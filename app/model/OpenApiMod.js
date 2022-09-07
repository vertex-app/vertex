const util = require('../libs/util');

class OpenApiMod {
  async widget (options) {
    const res = await util.requestPromise({
      url: 'http://172.20.99.3:4000/api/user/widget',
      method: 'POST',
      encoding: null,
      json: {
        apiKey: '412f38cf-56c3-4a67-b6cb-90b11e71ec7c',
        data: {
          upload: 1024000,
          download: 1024000,
          todayDownload: 1024000,
          todayUpload: 1024000
        }
      }
    });
    const buffer = Buffer.from(res.body, 'utf-8');
    return buffer;
  }
}

module.exports = OpenApiMod;
