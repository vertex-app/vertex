const logger = require('../libs/logger');
const util = require('../libs/util');
const SettingMod = require('../model/SettingMod');

const settingMod = new SettingMod();

class OpenApiMod {
  async widget (options) {
    if (!global.trustVertexPanel) {
      throw new Error('未信任 Vertex Panel, 如需使用本功能, 请前往 系统设置 - 安全设置 信任 Vertex Panel');
    }
    const runInfo = await settingMod.getRunInfo();
    const res = await util.requestPromise({
      url: 'https://dash.vertex-app.top/api/user/widget',
      method: 'POST',
      encoding: null,
      json: {
        apiKey: global.panelKey,
        data: {
          upload: runInfo.uploaded,
          download: runInfo.downloaded,
          todayDownload: runInfo.downloadedToday,
          todayUpload: runInfo.uploadedToday
        }
      }
    });
    const buffer = Buffer.from(res.body, 'utf-8');
    return buffer;
  }

  async siteInfo (options = {}) {
    if (!global.trustVertexPanel) {
      throw new Error('未信任 Vertex Panel, 如需使用本功能, 请前往 系统设置 - 安全设置 信任 Vertex Panel');
    }
    const siteList = util.listSite()
      .map(item => ({ name: item.name, hide: global.siteInfo.hideName.indexOf(item.name) !== -1 }))
      .filter(item => global.siteInfo.hide.indexOf(item.name) === -1);
    for (let site of siteList) {
      site = Object.assign(site, global.runningSite[site.name]?.info || {});
    }
    const res = await util.requestPromise({
      url: 'https://dash.vertex-app.top/api/user/siteInfo',
      method: 'POST',
      encoding: null,
      json: {
        apiKey: global.panelKey,
        retUrl: options.retUrl,
        data: {
          siteList,
          watermark: global.siteInfo.watermark
        }
      }
    });
    try {
      if (options.retUrl) {
        return 'https://dash.vertex-app.top' + '/images/' + res.body.data.url;
      }
      const buffer = Buffer.from(res.body, 'utf-8');
      return buffer;
    } catch (e) {
      logger.error(res.body);
      throw new Error('下载总览图片失败! 请查看日志');
    }
  }
}

module.exports = OpenApiMod;
