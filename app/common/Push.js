const moment = require('moment');
const CronJob = require('cron').CronJob;
const util = require('../libs/util');
const logger = require('../libs/logger');

class Push {
  constructor (push) {
    this.pushWrapper = {
      telegram: this.pushTelegram,
      wechat: this.pushWeChat
    };
    for (const key of Object.keys(push)) {
      this[key] = push[key];
    }
    this.clearCountCron = this.clearCountCron || '0 * * * *';
    this.clearCountJob = new CronJob(this.clearCountCron, () => this._clearErrorCount());
    this.maxErrorCount = +this.maxErrorCount || 100;
    this.errorCount = 0;
    this.accessToken = {
      token: '',
      refreshTime: 0
    };
    this.pushType = this.pushType || [];
    this.markdown = ['telegram', 'wechat'].indexOf(this.type) !== -1;
  };

  _clearErrorCount () {
    this.errorCount = 0;
  }

  async _refreshWeChatAccessToken () {
    const option = {
      url: `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.corpid}&corpsecret=${this.corpsecret}`
    };
    const res = await util.requestPromise(option);
    const json = JSON.parse(res.body);
    if (json.errmsg !== 'ok') {
      logger.error(json);
      throw new Error('获取 WeChat Access Token 报错');
    }
    this.accessToken.refreshTime = moment().unix();
    this.accessToken.token = json.access_token;
  }

  async _push (_push, text, desp, poster) {
    if (this.errorCount > this.maxErrorCount) {
      return logger.debug('周期内错误推送已达上限, 跳过本次推送');
    }
    if (_push && this.push) {
      return this.pushWrapper[this.type].call(this, text, desp, poster);
    }
  };

  async rssError (rss) {
    this.errorCount += 1;
    const text = 'Rss 失败 ' + moment().format('YYYY-MM-DD HH:mm:ss');
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
    this.errorCount += 1;
    const text = '抓取失败 ' + moment().format('YYYY-MM-DD HH:mm:ss');
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
    const text = '添加种子 ' + moment().format('YYYY-MM-DD HH:mm:ss');
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

  async selectTorrentError (alias, wish, note) {
    const text = '豆瓣选种失败 ' + moment().format('YYYY-MM-DD HH:mm:ss');
    let desp = `豆瓣账号: ${alias}\n${wish.name}\n`;
    if (note) {
      desp += note;
    } else {
      desp += wish.episodes ? `无匹配结果或暂未更新 / 已完成至 ${wish.episodeNow} 集 / 全 ${wish.episodes} 集` : '无匹配结果或暂未更新';
    }
    if (this.type === 'telegram') {
      desp = '```\n' + desp + '\n```';
      desp = '\\#豆瓣选种失败\n' + desp;
    }
    await this._push(this.pushType.indexOf('doubanSelectError') !== -1, text, desp, wish.poster);
  };

  async plexWebhook (event, note, poster) {
    const text = 'Plex 消息通知 ' + moment().format('YYYY-MM-DD HH:mm:ss');
    let desp = `Plex: ${event}\n` +
      `相关信息:\n${note}\n`;
    if (this.type === 'telegram') {
      desp = '```\n' + desp + '\n```';
      desp = '\\#Plex消息通知\n' + desp;
    }
    await this._push(this.pushType.indexOf('mediaServer') !== -1, text, desp, poster);
  };

  async addDoubanTorrent (client, torrent, rule, wish) {
    const text = '添加豆瓣种子 ' + moment().format('YYYY-MM-DD HH:mm:ss');
    const site = global.runningSite[torrent.site];
    let desp = `${wish.name} / ${client.alias} / ${rule.alias}\n`;
    desp += `站点名称: ${torrent.site} / ↑${util.formatSize(site.info.upload)} / ↓${util.formatSize(site.info.download)}\n`;
    desp += `种子标题: ${torrent.title}\n`;
    desp += `副标题: ${torrent.subtitle}\n`;
    desp += `体积: ${util.formatSize(torrent.size)}\n`;
    desp += `状态: ${torrent.seeders} / ${torrent.leechers} / ${torrent.snatches}`;
    desp += wish.episodes ? ` / 已完成至 ${wish.episodeNow} 集 / 全 ${wish.episodes} 集` : '';
    if (this.type === 'telegram') {
      desp = '```\n' + desp + '\n```';
      desp = '\\#添加豆瓣种子\n' + desp;
    }
    await this._push(this.pushType.indexOf('douban') !== -1, text, desp, wish.poster);
  };

  async addDoubanTorrentError (client, torrent, rule, wish) {
    const text = '添加豆瓣种子失败 ' + moment().format('YYYY-MM-DD HH:mm:ss');
    let desp = `${wish.name} / ${client.alias} / ${rule.alias}\n`;
    desp += `站点名称: ${torrent.site}\n`;
    desp += `种子标题: ${torrent.title}\n`;
    desp += `副标题: ${torrent.subtitle}\n`;
    desp += `状态: ${torrent.seeders} / ${torrent.leechers} / ${torrent.snatches}`;
    desp += wish.episodes ? ` / 已完成至 ${wish.episodeNow} 集 / 全 ${wish.episodes} 集` : '';
    if (this.type === 'telegram') {
      desp = '```\n' + desp + '\n```';
      desp = '\\#添加豆瓣种子失败\n' + desp;
    }
    await this._push(this.pushType.indexOf('raceError') !== -1, text, desp, wish.poster);
  };

  async addDouban (alias, wishes) {
    const text = '添加豆瓣账户 ' + moment().format('YYYY-MM-DD HH:mm:ss');
    let desp = `豆瓣账户: ${alias}\n` +
      `原有想看内容: \n${wishes.map(item => item.name).join('\n')}`;
    if (this.type === 'telegram') {
      desp = '```\n' + desp + '\n```';
      desp = '\\#添加豆瓣账户\n' + desp;
    }
    await this._push(this.pushType.indexOf('douban') !== -1, text, desp);
  };

  async startRefreshJob (alias) {
    const text = '刷新想看任务 ' + moment().format('YYYY-MM-DD HH:mm:ss');
    let desp = `豆瓣账户: ${alias}\n`;
    if (this.type === 'telegram') {
      desp = '```\n' + desp + '\n```';
      desp = '\\#刷新想看任务\n' + desp;
    }
    await this._push(this.pushType.indexOf('douban') !== -1, text, desp);
  };

  async addDoubanWish (alias, wish) {
    const text = '添加想看 ' + moment().format('YYYY-MM-DD HH:mm:ss');
    let desp = `豆瓣账户: ${alias}\n` +
      `${wish.name} / ${wish.year} / ${wish.area} / ${wish.mainCreator} / ${wish.language} / ${wish.length} / ${wish.category}\n${wish.desc}`;
    if (this.type === 'telegram') {
      desp = '```\n' + desp + '\n```';
      desp = '\\#添加想看\n' + desp;
    }
    await this._push(this.pushType.indexOf('douban') !== -1, text, desp, wish.poster);
  };

  async torrentFinish (note) {
    const text = '种子已完成 ' + moment().format('YYYY-MM-DD HH:mm:ss');
    let desp = `${note.wish.name}\n`;
    desp += `${note.torrent.site} / ${note.torrent.title}`;
    desp += note.wish.episodes ? ` / 已完成至 ${note.wish.episodeNow} 集 / 全 ${note.wish.episodes} 集\n` : '\n';
    desp += `${note.wish.name} / ${note.wish.year} / ${note.wish.area} / ${note.wish.mainCreator} / ${note.wish.language} / ${note.wish.length} / ${note.wish.category}\n${note.wish.desc}`;
    if (this.type === 'telegram') {
      desp = '```\n' + desp + '\n```';
      desp = '\\#种子已完成\n' + desp;
    }
    await this._push(this.pushType.indexOf('finish') !== -1, text, desp, note.wish.poster);
  };

  async addTorrentError (rss, client, torrent) {
    this.errorCount += 1;
    const text = '添加种子失败 ' + moment().format('YYYY-MM-DD HH:mm:ss');
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
    const text = '拒绝种子 ' + moment().format('YYYY-MM-DD HH:mm:ss');
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
    const text = '删除种子 ' + moment().format('YYYY-MM-DD HH:mm:ss');
    let desp = `下载器名: ${client.alias}\n` +
      `种子名称: ${torrent.name}\n` +
      `种子大小: ${util.formatSize(torrent.size)}\n` +
      `已完成量: ${util.formatSize(torrent.completed)}\n` +
      `种子状态: ${torrent.state}\n` +
      `添加时间: ${moment(torrent.addedTime * 1000).format('YYYY-MM-DD HH:mm:ss')}\n` +
      `删除时间: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n` +
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
    this.errorCount += 1;
    const text = '删除种子失败 ' + moment().format('YYYY-MM-DD HH:mm:ss');
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
    const text = '重新汇报种子 ' + moment().format('YYYY-MM-DD HH:mm:ss');
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
    const text = '下载器已连接 ' + moment().format('YYYY-MM-DD HH:mm:ss');
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
    this.errorCount += 1;
    const text = '下载器登陆失败 ' + moment().format('YYYY-MM-DD HH:mm:ss');
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
    if (this.errorCount > this.maxErrorCount) {
      return logger.debug('周期内错误推送已达上限, 跳过本次推送');
    }
    this.errorCount += 1;
    const text = '获取下载器信息失败 ' + moment().format('YYYY-MM-DD HH:mm:ss');
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
    const text = '剩余空间警告 ' + moment().format('YYYY-MM-DD HH:mm:ss');
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

  async pushWeChat (text, desp, poster) {
    if (moment().unix() - this.accessToken.refreshTime > 3600) {
      await this._refreshWeChatAccessToken();
    }
    let _poster;
    if (text.indexOf('Plex') !== -1) {
      _poster = poster || global.plexCover;
    }
    if (text.indexOf('Emby') !== -1) {
      _poster = poster || global.embyCover;
    }
    if (text.indexOf('Jellyfin') !== -1) {
      _poster = poster || global.jellyfinCover;
    }
    _poster = _poster || poster || global.wechatCover || 'https://pic.lswl.in/images/2022/01/25/52c3764f3357e87f494c50f2d720e899.png';
    const body = {
      touser: '@all',
      msgtype: 'news',
      agentid: this.agentid,
      enable_id_trans: 0,
      enable_duplicate_check: 0,
      duplicate_check_interval: 1800
    };
    if (desp.indexOf('```') === -1) {
      body.news = {
        articles: [
          {
            title: text,
            description: desp,
            url: 'https://vertex.icu',
            picurl: _poster
          }
        ]
      };
    } else {
      body.msgtype = 'text';
      body.text = {
        content: text + '\n' + desp.replace(/\n?```\n?/g, '')
      };
    }
    const option = {
      url: `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${this.accessToken.token}`,
      method: 'POST',
      json: body
    };
    const res = await util.requestPromise(option);
    if (res.body.errcode !== 0) {
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
