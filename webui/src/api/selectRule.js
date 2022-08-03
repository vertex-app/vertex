import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/selectRule/list';
    return await get(url);
  },
  modify: async (selectRule) => {
    const url = '/api/selectRule/' + (selectRule.id ? 'modify' : 'add');
    return await post(url, selectRule);
  },
  delete: async (id) => {
    const url = '/api/selectRule/delete';
    return await post(url, { id });
  }
};
