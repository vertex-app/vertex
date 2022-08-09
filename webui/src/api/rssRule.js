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
  delete: async (id) => {
    const url = '/api/rssRule/delete';
    return await post(url, { id });
  }
};
