import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/notification/list';
    return await get(url);
  },
  modify: async (notification) => {
    const url = '/api/notification/' + (notification.id ? 'modify' : 'add');
    return await post(url, notification);
  },
  delete: async (id) => {
    const url = '/api/notification/delete';
    return await post(url, { id });
  }
};
