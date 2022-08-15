import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/linkRule/list';
    return await get(url);
  },
  modify: async (linkRule) => {
    const url = '/api/linkRule/' + (linkRule.id ? 'modify' : 'add');
    return await post(url, linkRule);
  },
  delete: async (id) => {
    const url = '/api/linkRule/delete';
    return await post(url, { id });
  }
};
