const cron = require('node-cron');
const logger = require('../libs/logger');
const Wechat = require('../libs/push/wechat');
const Slack = require('../libs/push/slack');
const Telegram = require('../libs/push/telegram');
const Ntfy = require('../libs/push/ntfy');
const Webhook = require('../libs/push/webhook');

const PUSH = {
  wechat: Wechat,
  slack: Slack,
  telegram: Telegram,
  ntfy: Ntfy,
  webhook: Webhook
};

class Push {
  constructor (push) {
    this.push = push.push;
    this.alias = push.alias;
    this.type = push.type;
    this.maxErrorCount = push.maxErrorCount;
    this.clearCountCron = push.clearCountCron;
    this.pushType = push.pushType || [];
    const additionPushType = [
      'pushWeChat', 'pushWeChatSelector', 'modifyWechatMenu', 'edit',
      'pushPlexStartOrStopToSlack', 'pushEmbyStartOrStopToSlack', 'pushSlackRaw',
      'openSlackView', 'pushSlack',
      'pushTelegram', 'pushNtfy', 'pushWebhook'
    ];
    this.pushType = this.pushType.concat(additionPushType);
    if (this.push && !push.dryrun) {
      this.p = new PUSH[this.type](push);
      this.clearCountCron = this.clearCountCron || '0 * * * *';
      this.clearCountJob = cron.schedule(this.clearCountCron, () => this._clearErrorCount());
      this.maxErrorCount = +this.maxErrorCount || 100;
      this.errorCount = 0;
      this.accessToken = {
        token: '',
        refreshTime: 0
      };
      logger.info('通知工具', this.alias, '初始化成功');
    }
  };

  _clearErrorCount () {
    this.errorCount = 0;
  }

  async doRequest (type, args) {
    if (!this.push) {
      return 0;
    }
    if (this.errorCount > this.maxErrorCount && (type.indexOf('Error') !== -1 || type.indexOf('Failed') !== -1)) {
      logger.debug('周期内错误推送已达上限, 跳过本次推送');
      return 0;
    }
    if (this.pushType.indexOf(type) === -1) {
      return 0;
    }
    try {
      if (type === 'push') {
        return await (this.p.pushWeChat || this.p.pushSlack || this.p.pushTelegram || this.p.pushNtfy || this.p.pushWebhook)(...args);
      }
      return await this.p[type](...args);
    } catch (e) {
      logger.error('发送通知信息失败:\n', e);
    }
  };

  async rssError (...args) {
    this.errorCount += 1;
    await this.doRequest('rssError', args);
  }

  async scrapeError (...args) {
    this.errorCount += 1;
    await this.doRequest('scrapeError', args);
  }

  async addTorrent (...args) {
    await this.doRequest('addTorrent', args);
  };

  async addTorrentError (...args) {
    this.errorCount += 1;
    await this.doRequest('addTorrentError', args);
  };

  async rejectTorrent (...args) {
    await this.doRequest('rejectTorrent', args);
  };

  async deleteTorrent (...args) {
    await this.doRequest('deleteTorrent', args);
  };

  async deleteTorrentError (...args) {
    this.errorCount += 1;
    await this.doRequest('deleteTorrentError', args);
  };

  async reannounceTorrent (...args) {
    await this.doRequest('reannounceTorrent', args);
  };

  async reannounceTorrentError (...args) {
    this.errorCount += 1;
    await this.doRequest('reannounceTorrentError', args);
  };

  async connectClient (...args) {
    return await this.doRequest('connectClient', args);
  }

  async clientLoginError (...args) {
    this.errorCount += 1;
    await this.doRequest('clientLoginError', args);
  }

  async getMaindataError (...args) {
    this.errorCount += 1;
    await this.doRequest('getMaindataError', args);
  }

  async spaceAlarm (...args) {
    this.errorCount += 1;
    await this.doRequest('spaceAlarm', args);
  }

  async plexWebhook (...args) {
    await this.doRequest('plexWebhook', args);
  };

  async embyWebhook (...args) {
    await this.doRequest('embyWebhook', args);
  };

  async jellyfinWebhook (...args) {
    await this.doRequest('jellyfinWebhook', args);
  };

  async selectWish (...args) {
    await this.doRequest('selectWish', args);
  };

  async addDoubanTorrent (...args) {
    await this.doRequest('addDoubanTorrent', args);
  };

  async addDoubanTorrentError (...args) {
    this.errorCount += 1;
    await this.doRequest('addDoubanTorrentError', args);
  };

  async torrentFinish (...args) {
    await this.doRequest('torrentFinish', args);
  };

  async selectTorrentError (...args) {
    await this.doRequest('selectTorrentError', args);
  };

  async addDouban (...args) {
    await this.doRequest('addDouban', args);
  };

  async startRefreshWish (...args) {
    await this.doRequest('startRefreshWish', args);
  };

  async startRefreshWishError (...args) {
    this.errorCount += 1;
    await this.doRequest('startRefreshWishError', args);
  };

  async addDoubanWish (...args) {
    await this.doRequest('addDoubanWish', args);
  };

  async scrapeTorrent (...args) {
    await this.doRequest('scrapeTorrent', args);
  }

  async scrapeTorrentFailed (...args) {
    this.errorCount += 1;
    await this.doRequest('scrapeTorrentFailed', args);
  }

  async pushTelegram (...args) {
    await this.doRequest('pushTelegram', args);
  }

  async pushNtfy (...args) {
    await this.doRequest('pushNtfy', args);
  }

  async pushWeChat (...args) {
    await this.doRequest('pushWeChat', args);
  };

  async pushWeChatSelector (...args) {
    await this.doRequest('pushWeChatSelector', args);
  };

  async modifyWechatMenu () {
    await this.doRequest('modifyWechatMenu', []);
  };

  async edit (...args) {
    await this.doRequest('edit', args);
  }

  async pushPlexStartOrStopToSlack (...args) {
    await this.doRequest('pushPlexStartOrStopToSlack', args);
  }

  async pushEmbyStartOrStopToSlack (...args) {
    await this.doRequest('pushEmbyStartOrStopToSlack', args);
  }

  async pushSlack (...args) {
    await this.doRequest('pushSlack', args);
  }

  async pushSlackRaw (...args) {
    await this.doRequest('pushSlackRaw', args);
  }

  async openSlackView (...args) {
    await this.doRequest('openSlackView', args);
  }

  async push (...args) {
    await this.doRequest('push', args);
  }
};

module.exports = Push;
