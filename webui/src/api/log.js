import { get } from '../util/axios';

export default {
  get: async (type) => {
    const url = `/api/log/get?type=${type}&_=${Math.random()}`;
    return await get(url);
  },
  clear: async () => {
    const url = '/api/log/clear';
    return await get(url);
  }
};
