import user from './user';
import server from './server';
import site from './site';
import setting from './setting';
import notification from './notification';
import downloader from './downloader';
import deleteRule from './deleteRule';
import linkRule from './linkRule';
import rssRule from './rssRule';
import selectRule from './selectRule';
import rss from './rss';
import script from './script';
import watch from './watch';
import subscribe from './subscribe';
import torrent from './torrent';
import log from './log';

const api = {
  user,
  setting,
  downloader,
  server,
  site,
  notification,
  deleteRule,
  linkRule,
  rssRule,
  selectRule,
  rss,
  script,
  subscribe,
  torrent,
  log,
  watch
};

export default () => { return api; };
