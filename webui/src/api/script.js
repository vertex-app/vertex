import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/script/list';
    return await get(url);
  },
  modify: async (script) => {
    const url = '/api/script/' + (script.id ? 'modify' : 'add');
    return await post(url, script);
  },
  delete: async (id) => {
    const url = '/api/script/delete';
    return await post(url, { id });
  },
  run: async (script) => {
    const url = '/api/script/run';
    return await post(url, script);
  }
};
