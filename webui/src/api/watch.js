import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/watch/list';
    return await get(url);
  },
  listHistory: async () => {
    const url = '/api/watch/listHistory';
    return await get(url);
  },
  modify: async (watch) => {
    const url = '/api/watch/' + (watch.id ? 'modify' : 'add');
    return await post(url, watch);
  },
  delete: async (id) => {
    const url = '/api/watch/delete';
    return await post(url, { id });
  },
  delRecord: async (body) => {
    const url = '/api/watch/deleteRecord';
    return await post(url, body);
  }
};
