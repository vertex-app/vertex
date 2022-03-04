class WebhookMod {
  async plex (req) {
    const payload = JSON.parse(req.body.payload);
    const eventMap = {
      'library-new': '媒体已添加',
      'media-play': '播放已开始',
      'media-pause': '播放已暂停',
      'media-resume': '播放已恢复',
      'media-stop': '播放已停止'
    };
    const event = eventMap[payload.event.replace('.', '-')] + ': ' + payload.Metadata.title + ' / ' + (payload.Metadata.originalTitle || '');
    const server = payload.Server.title;
    const note = `用户: ${payload.Account.title}\n` +
      `媒体: ${payload.Metadata.title} / ${payload.Metadata.originalTitle || ''}\n` +
      `服务器: ${payload.Server.title}\n` +
      `媒体库: ${payload.Metadata.librarySectionTitle}\n`;
    if (global.webhookPush) {
      await global.webhookPush.plexWebhook(event, note);
    }
    return '';
  }
}
module.exports = WebhookMod;
