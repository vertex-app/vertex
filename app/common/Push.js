const moment = require('moment');
const CronJob = require('cron').CronJob;
const util = require('../libs/util');
const logger = require('../libs/logger');

class Push {
  constructor (push) {
    this.pushWrapper = {
      iyuu: this.pushIyuu,
      telegram: this.pushTelegram,
      bark: this.pushBark
    };
    for (const key of Object.keys(push)) {
      this[key] = push[key];
    }
    this.clearCountCron = this.clearCountCron || '0 * * * *';
    this.clearCountJob = new CronJob(this.clearCountCron, () => this._clearErrorCount());
    this.maxErrorCount = +this.maxErrorCount || 100;
    this.errorCount = 0;
    this.pushType = this.pushType || [];
    this.markdown = ['telegram'].indexOf(this.type) !== -1;
  };

  _clearErrorCount () {
    this.errotCount = 0;
  }

  async _push (_push, text, desp) {
    if (_push && this.push) {
      return this.pushWrapper[this.type].call(this, text, desp);
    }
  };

  async rssError (rss) {
    if (this.errotCount > this.maxErrorCount) {
      return logger.debug('周期内错误推送已达上限, 跳过本次推送');
    }
    this.errotCount += 1;
    const text = 'Rss 失败: ' + rss.alias;
    let desp = `Rss 任务: ${rss.alias}` +
      '详细原因请前往 Vertex 日志页面查看';
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#Rss失败\n' + desp;
    }
    await this._push(this.pushType.indexOf('rssError') !== -1, text, desp);
  }

  async scrapeError (rss, torrent) {
    if (this.errotCount > this.maxErrorCount) {
      return logger.debug('周期内错误推送已达上限, 跳过本次推送');
    }
    this.errotCount += 1;
    const text = '抓取失败: ' + rss.alias;
    let desp = `Rss 任务: ${rss.alias}` +
      `种子名称: ${torrent.name}` +
      '请确认 Rss 站点是否支持抓取免费或抓取 HR, 若确认无问题, 请前往 Vertex 日志页面查看详细原因';
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#抓取失败\n' + desp;
    }
    await this._push(this.pushType.indexOf('scrapeError') !== -1, text, desp);
  }

  async addTorrent (rss, client, torrent) {
    const text = `添加种子: ${torrent.name.substring(0, 10) + '...'} | ${rss.alias} | ${util.formatSize(torrent.size)} | ${client.alias}`;
    let desp = `Rss 任务: ${rss.alias}\n` +
      `下载器名: ${client.alias}\n` +
      `种子名称: ${torrent.name}\n` +
      `种子大小: ${util.formatSize(torrent.size)}`;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#添加种子\n' + desp;
    }
    await this._push(this.pushType.indexOf('add') !== -1, text, desp);
  };

  async addRaceTorrent (race, client, torrent, rule) {
    const text = `添加追剧种子: ${torrent.title.substring(0, 10) + '...'} | ${race.alias} | ${util.formatSize(torrent.size)} | ${client.alias}`;
    let desp = `追剧任务: ${race.alias}\n` +
      `下载器名: ${client.alias}\n` +
      `种子名称: ${torrent.name}\n` +
      `种子大小: ${util.formatSize(torrent.size)}\n` +
      `择剧规则: ${rule.alias}`;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#添加追剧种子\n' + desp;
    }
    await this._push(this.pushType.indexOf('race') !== -1, text, desp);
  };

  async addRaceTorrentError (raceAlias, client, torrent, rule) {
    const text = `添加追剧种子失败: ${torrent.title.substring(0, 10) + '...'} | ${raceAlias} | ${util.formatSize(torrent.size)} | ${client.alias}`;
    let desp = `追剧任务: ${raceAlias}\n` +
      `下载器名: ${client.alias}\n` +
      `种子名称: ${torrent.name}\n` +
      `种子大小: ${util.formatSize(torrent.size)}\n` +
      `择剧规则: ${rule.alias}\n` +
      '详细信息前往 Vertex 日志页查看';
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#添加追剧种子失败\n' + desp;
    }
    await this._push(this.pushType.indexOf('raceError') !== -1, text, desp);
  };

  async addDoubanTorrent (alias, client, torrent, rule) {
    const text = `添加豆瓣种子: ${torrent.title.substring(0, 10) + '...'} | ${alias} | ${util.formatSize(torrent.size)} | ${client.alias}`;
    let desp = `追剧任务: ${alias}\n` +
      `下载器名: ${client.alias}\n` +
      `种子名称: ${torrent.name}\n` +
      `种子大小: ${util.formatSize(torrent.size)}\n` +
      `择剧规则: ${rule.alias}`;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#添加豆瓣种子\n' + desp;
    }
    await this._push(this.pushType.indexOf('douban') !== -1, text, desp);
  };

  async addDoubanTorrentError (raceAlias, client, torrent, rule) {
    const text = `添加豆瓣种子失败: ${torrent.title.substring(0, 10) + '...'} | ${raceAlias} | ${util.formatSize(torrent.size)} | ${client.alias}`;
    let desp = `追剧任务: ${raceAlias}\n` +
      `下载器名: ${client.alias}\n` +
      `种子名称: ${torrent.name}\n` +
      `种子大小: ${util.formatSize(torrent.size)}\n` +
      `择剧规则: ${rule.alias}\n` +
      '详细信息前往 Vertex 日志页查看';
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#添加豆瓣种子失败\n' + desp;
    }
    await this._push(this.pushType.indexOf('raceError') !== -1, text, desp);
  };

  async addDouban (alias, wishes) {
    const text = `添加豆瓣账户: ${alias}`;
    let desp = `豆瓣账户: ${alias}\n` +
      `原有想看内容: \n${wishes.map(item => item.name).join('\n')}`;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#添加豆瓣账户\n' + desp;
    }
    await this._push(this.pushType.indexOf('douban') !== -1, text, desp);
  };

  async addDoubanWish (alias, wishes) {
    const text = `添加想看: ${wishes.map(item => item.name).join(' | ')} || 豆瓣账户: ${alias}`;
    let desp = `豆瓣账户: ${alias}\n` +
      `添加想看: \n${wishes.map(item => item.name).join('\n')}`;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#添加想看\n' + desp;
    }
    await this._push(this.pushType.indexOf('douban') !== -1, text, desp);
  };

  async addTorrentError (rss, client, torrent) {
    if (this.errotCount > this.maxErrorCount) {
      return logger.debug('周期内错误推送已达上限, 跳过本次推送');
    }
    this.errotCount += 1;
    const text = '添加种子失败: ' + torrent.name;
    let desp = `Rss 任务: ${rss.alias}\n` +
      `下载器名: ${client.alias}\n` +
      `种子名称: ${torrent.name}\n` +
      `种子大小: ${util.formatSize(torrent.size)}\n` +
      '详细原因请前往 Vertex 日志页面查看';
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#添加种子失败\n' + desp;
    }
    await this._push(this.pushType.indexOf('addError') !== -1, text, desp);
  };

  async rejectTorrent (rss, client = {}, torrent, note) {
    const text = `拒绝种子: ${torrent.name.substring(0, 10) + '...'} | ${rss.alias} | ${util.formatSize(torrent.size)} | ${client.alias || '未定义'} | ${note}`;
    let desp = `Rss 任务: ${rss.alias}\n` +
      `下载器名: ${client.alias || '未定义'}\n` +
      `种子名称: ${torrent.name}\n` +
      `种子大小: ${util.formatSize(torrent.size)}\n` +
      note;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#拒绝种子\n' + desp;
    }
    await this._push(this.pushType.indexOf('reject') !== -1, text, desp);
  };

  async deleteTorrent (client, torrent, rule, deleteFile) {
    const text = `删除种子: ${torrent.name.substring(0, 20) + '...'} | ${util.formatSize(torrent.size)} | ${client.alias} |` +
      `${util.formatSize(torrent.uploaded)} / ${util.formatSize(torrent.downloaded)} | ${(+torrent.ratio).toFixed(2)} | ${rule.alias} | ${torrent.category} | ${torrent.tracker}`;
    let desp = `下载器名: ${client.alias}\n` +
      `种子名称: ${torrent.name}\n` +
      `种子大小: ${util.formatSize(torrent.size)}\n` +
      `已完成量: ${util.formatSize(torrent.completed)}\n` +
      `种子状态: ${torrent.state}\n` +
      `所属分类: ${torrent.category}\n` +
      `流量统计: ${util.formatSize(torrent.uploaded)} / ${util.formatSize(torrent.downloaded)}\n` +
      `即时速度: ${util.formatSize(torrent.uploadSpeed)}/s / ${util.formatSize(torrent.downloadSpeed)}/s\n` +
      `分享比率: ${(+torrent.ratio).toFixed(2)}\n` +
      `站点域名: ${torrent.tracker}\n` +
      `删除文件: ${deleteFile}\n` +
      `符合规则: ${rule.alias}\n`;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#删除种子\n' + desp;
    }
    await this._push(this.pushType.indexOf('delete') !== -1, text, desp);
  };

  async deleteTorrentError (client, torrent, rule) {
    if (this.errotCount > this.maxErrorCount) {
      return logger.debug('周期内错误推送已达上限, 跳过本次推送');
    }
    this.errotCount += 1;
    const text = '删除种子失败: ' + torrent.name;
    let desp = `下载器名: ${client.alias}\n` +
      `种子名称: ${torrent.name}\n` +
      `种子大小: ${util.formatSize(torrent.size)}\n` +
      `已完成量: ${util.formatSize(torrent.completed)}\n` +
      `种子状态: ${torrent.completed.state}\n` +
      `所属分类: ${torrent.category}\n` +
      `流量统计: ${util.formatSize(torrent.uploaded)} / ${util.formatSize(torrent.downloaded)}\n` +
      `即时速度: ${util.formatSize(torrent.uploadSpeed)}/s / ${util.formatSize(torrent.downloadSpeed)}/s\n` +
      `分享比率: ${(+torrent.ratio).toFixed(2)}\n` +
      `站点域名: ${torrent.tracker}\n` +
      `符合规则: ${rule.alias}\n`;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#删除种子失败\n' + desp;
    }
    await this._push(this.pushType.indexOf('deleteError') !== -1, text, desp);
  };

  async reannounceTorrent (client, torrent) {
    const text = '重新汇报种子: ' + torrent.name;
    let desp = `下载器名: ${client.alias}\n` +
      `种子名称: ${torrent.name}`;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#重新汇报种子\n' + desp;
    }
    await this._push(this.pushType.indexOf('reannounce') !== -1, text, desp);
  };

  async connectClient (client) {
    const text = '下载器已连接: ' + client.alias;
    let desp = `下载器: ${client.alias}`;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#下载器已连接\n' + desp;
    }
    return await this._push(this.pushType.indexOf('clientConnect') !== -1, text, desp);
  }

  async clientLoginError (client, message) {
    if (this.errotCount > this.maxErrorCount) {
      return logger.debug('周期内错误推送已达上限, 跳过本次推送');
    }
    this.errotCount += 1;
    const text = '下载器登陆失败: ' + client.alias;
    let desp = `下载器名: ${client.alias}\n` +
      `附加信息: ${message}`;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#下载器登陆失败\n' + desp;
    }
    await this._push(this.pushType.indexOf('clientLoginError') !== -1, text, desp);
  }

  async getMaindataError (client) {
    if (this.errotCount > this.maxErrorCount) {
      return logger.debug('周期内错误推送已达上限, 跳过本次推送');
    }
    this.errotCount += 1;
    const text = '获取下载器信息失败: ' + client.alias;
    let desp = `下载器名: ${client.alias}\n` +
      '详细原因请前往 Vertex 日志页面查看';
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#获取下载器信息失败\n' + desp;
    }
    await this._push(this.pushType.indexOf('getMaindataError') !== -1, text, desp);
  }

  async spaceAlarm (client) {
    const text = '剩余空间警告: ' + client.alias;
    let desp = `下载器名: ${client.alias}\n` +
      `剩余空间已不足${util.formatSize(client.maindata.freeSpaceOnDisk)}`;
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#剩余空间警告\n' + desp;
    }
    await this._push(this.pushType.indexOf('spaceAlarm') !== -1, text, desp);
  }

  async pushSiteData () {
    const siteList = util.listSite();
    const text = '站点数据推送';
    let desp = '';
    for (const site of siteList) {
      site.info = (global.runningSite[site.name] || {}).info;
      if (!site.info) {
        desp += `${site.name}: 未启用\n`;
        continue;
      }
      desp += `${site.name}:\n` +
      `用户名称: ${site.info.username}\n` +
      `上传下载: ${util.formatSize(site.info.upload)} / ${util.formatSize(site.info.download)}\n` +
      `做种情况: ${site.info.seeding} / ${util.formatSize(site.info.seedingSize || 0)}\n` +
      `更新时间: ${moment(site.info.updateTime * 1000).format('YYYY-MM-DD HH:mm:ss')}\n\n`;
    }
    if (this.markdown) {
      desp = '```\n' + desp + '\n```';
    }
    if (this.type === 'telegram') {
      desp = '\\#站点数据推送\n' + desp;
    }
    await this._push(this.pushType.indexOf('siteData') !== -1, text, desp);
  }

  async pushIyuu (text, desp) {
    const option = {
      url: `https://iyuu.cn/${this.iyuuToken}.send`,
      method: 'POST',
      strictSSL: false,
      formData: {
        text,
        desp
      }
    };
    const res = await util.requestPromise(option);
    const json = JSON.parse(res.body);
    if (json.errcode !== 0) {
      logger.error('推送失败', this.alias, text, res.body);
    }
  };

  async pushTelegram (text, desp) {
    const option = {
      url: `${global.telegramProxy}/bot${this.telegramBotToken}/sendMessage`,
      method: 'POST',
      json: {
        chat_id: this.telegramChannel,
        text: desp,
        parse_mode: 'MarkdownV2'
      }
    };
    const res = await util.requestPromise(option);
    const json = res.body;
    if (!json.ok) {
      logger.error('推送失败', this.alias, text, res.body);
      return;
    }
    return json.result.message_id;
  };

  async pushBark (text, desp) {
    const option = {
      url: `https://api.day.app/${this.barkToken}/${encodeURIComponent(text)}/${encodeURIComponent(desp)}?icon=${encodeURIComponent('https://pic.lswl.in/images/2022/01/26/3d128357f09b4d44c40d5596506d1d1f.th.png')}`,
      method: 'GET'
    };
    const res = await util.requestPromise(option);
    const json = JSON.parse(res.body);
    if (json.code !== 200) {
      logger.error('推送失败', this.alias, text, res.body);
    }
  }

  async edit (messageId, maindata) {
    const torrents = maindata.torrents.sort((a, b) => b.uploadSpeed - a.uploadSpeed || b.downloadSpeed - a.downloadSpeed).slice(0, 10);
    let message = '';
    for (let i = 0; i < 10; i++) {
      if (!torrents[i]) break;
      message += `<pre>${i + 1}:</pre>\n`;
      message += `<pre>  ${torrents[i].name.length > 20 ? torrents[i].name.substring(0, 20) + '..' : torrents[i].name}</pre>\n`;
      message += `<pre>  ↑/↓: ${util.formatSize(torrents[i].uploadSpeed)}/s / ${util.formatSize(torrents[i].downloadSpeed)}/s</pre>\n`;
      message += `<pre>  ↑/↓: ${util.formatSize(torrents[i].uploaded)} / ${util.formatSize(torrents[i].downloaded)}</pre>\n`;
      message += `<pre>  Ratio: ${torrents[i].ratio.toFixed(3)}</pre>\n`;
      message += `<pre>  Size: ${util.formatSize(torrents[i].size)}</pre>\n`;
      message += `<pre>  Progress: ${torrents[i].progress.toFixed(3)}</pre>\n`;
      message += `<pre>  Tracker: ${torrents[i].tracker}</pre>\n`;
    }
    message += '\n';
    message += `<pre>S/L: ${maindata.seedingCount} / ${maindata.leechingCount}</pre>\n`;
    message += `<pre>↑/↓: ${util.formatSize(maindata.uploadSpeed)}/s / ${util.formatSize(maindata.downloadSpeed)}/s</pre>\n`;
    message += `<pre>Free Space: ${util.formatSize(maindata.freeSpaceOnDisk)}</pre>\n`;
    message += `<pre>Update Time: ${moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss')}</pre>`;
    const option = {
      url: `${global.telegramProxy}/bot${this.telegramBotToken}/editMessageText`,
      method: 'POST',
      json: {
        chat_id: this.telegramChannel,
        message_id: messageId,
        text: message,
        parse_mode: 'HTML'
      }
    };
    const res = await util.requestPromise(option);
    const json = res.body;
    if (!json.ok) {
      logger.error('推送失败', this.alias, res.body);
    }
  }
};

module.exports = Push;
