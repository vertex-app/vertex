const util = require('../util');

class Webhook {
  constructor (webhook) {
    this.webhookurl = webhook.webhookurl;
    this.token = webhook.token;
    this.alias = webhook.alias;
  };

  async pushWebhook (event, payload) {
    if (payload.client && typeof payload.client === 'object') {
      payload.client = {
        id: payload.client.id,
        alias: payload.client.alias,
        clientUrl: payload.client.clientUrl
      };
    }
    payload.event = event;
    const option = {
      url: this.webhookurl,
      method: 'POST',
      headers: {
        'x-vertex-token': this.token
      },
      json: payload
    };
    await util.requestPromise(option);
    return '';
  };

  async rssError (rss) {
    await this.pushWebhook('rss.error', rss);
  };

  async scrapeError (rss, torrent) {
    await this.pushWebhook('rss.scrape.error', { rss, torrent });
  };

  async addTorrent (rss, client, torrent) {
    await this.pushWebhook('rss.torrent.add', { rss, client, torrent });
  };

  async selectTorrentError (alias, wish, note) {
    await this.pushWebhook('douban.select.error', { alias, wish, note });
  };

  async addDoubanTorrent (client, torrent, rule, wish) {
    await this.pushWebhook('douban.select.add', { client, torrent, rule, wish });
  };

  async addDoubanTorrentError (client, torrent, rule, wish) {
    await this.pushWebhook('douban.select.add.error', { client, torrent, rule, wish });
  };

  async addDouban (alias, wishes) {
    await this.pushWebhook('douban.task.add', { alias, wishes });
  };

  async startRefreshWish (key) {
    await this.pushWebhook('douban.wish.refresh.start', { key });
  };

  async startRefreshWishError (key) {
    await this.pushWebhook('douban.wish.refresh.error', { key });
  };

  async addDoubanWish (alias, wish) {
    await this.pushWebhook('douban.wish.add', { alias, wish });
  };

  async torrentFinish (note) {
    await this.pushWebhook('client.torrent.finish', { note });
  };

  async addTorrentError (rss, client, torrent) {
    await this.pushWebhook('rss.torrent.add.error', { rss, client, torrent });
  };

  async rejectTorrent (rss, client = {}, torrent, note) {
    await this.pushWebhook('rss.torrent.reject', { rss, client, torrent, note });
  };

  async deleteTorrent (client, torrent, rule, deleteFile) {
    await this.pushWebhook('client.torrent.delete', { client, torrent, rule, deleteFile });
  };

  async deleteTorrentError (client, torrent, rule) {
    await this.pushWebhook('client.torrent.delete.error', { client, torrent, rule });
  };

  async reannounceTorrent (client, torrent) {
    await this.pushWebhook('client.torrent.reannounce', { client, torrent });
  };

  async reannounceTorrentError (client, torrent) {
    await this.pushWebhook('client.torrent.reannounce.error', { client, torrent });
  };

  async connectClient (client) {
    await this.pushWebhook('client.connect', { client });
  };

  async clientLoginError (client, message) {
    await this.pushWebhook('client.connect.error', { client, message });
  };

  async scrapeTorrent (alias, torrentName, scrapedName) {
    await this.pushWebhook('watch.scrape.torrent', { alias, torrentName, scrapedName });
  };

  async scrapeTorrentFailed (alias, torrentName, note) {
    await this.pushWebhook('watch.scrape.torrent.error', { alias, torrentName, note });
  };

  async getMaindataError (client) {
    await this.pushWebhook('client.maindata.error', { client });
  };

  async spaceAlarm (client) {
    await this.pushWebhook('client.space.alarm', { client });
  };

  async pushPlexStartOrStopToSlack (payload) {
    await this.pushWebhook('media.plex.startorstop', { payload });
  }

  async pushEmbyStartOrStopToSlack (payload) {
    await this.pushWebhook('media.emby.startorstop', { payload });
  }
};

module.exports = Webhook;
