import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/rss/list';
    return await get(url);
  },
  modify: async (rss) => {
    const url = '/api/rss/' + (rss.id ? 'modify' : 'add');
    return await post(url, rss);
  },
  delete: async (id) => {
    const url = '/api/rss/delete';
    return await post(url, { id });
  },
  delRecord: async (body) => {
    const url = '/api/rss/deleteRecord';
    return await post(url, body);
  },
  dryrun: async (rss) => {
    const url = '/api/rss/dryrun';
    return await post(url, rss);
  },
  mikanSearch: async (rss) => {
    const url = '/api/rss/mikanSearch';
    return await post(url, rss);
  },
  mikanPush: async (body) => {
    const url = '/api/rss/mikanPush';
    return await post(url, body);
  }
};
