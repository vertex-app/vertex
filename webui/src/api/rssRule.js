import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/rssRule/list';
    return await get(url);
  },
  modify: async (rssRule) => {
    const url = '/api/rssRule/' + (rssRule.id ? 'modify' : 'add');
    return await post(url, rssRule);
  },
  rss: async (id) => {
    const url = '/api/rssRule/rss';
    return await post(url, { id });
  }
};
