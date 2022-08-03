import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/deleteRule/list';
    return await get(url);
  },
  modify: async (deleteRule) => {
    const url = '/api/deleteRule/' + (deleteRule.id ? 'modify' : 'add');
    return await post(url, deleteRule);
  },
  delete: async (id) => {
    const url = '/api/deleteRule/delete';
    return await post(url, { id });
  }
};
