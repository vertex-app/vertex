import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/server/list';
    return await get(url);
  },
  modify: async (server) => {
    const url = '/api/server/' + (server.id ? 'modify' : 'add');
    return await post(url, server);
  },
  delete: async (id) => {
    const url = '/api/server/delete';
    return await post(url, { id });
  },
  reload: async (id) => {
    const url = '/api/server/reload?id=' + id;
    return await get(url);
  },
  netSpeed: async () => {
    const url = '/api/server/netSpeed?_=' + Math.random();
    return await get(url);
  },
  cpuUse: async () => {
    const url = '/api/server/cpuUse?_=' + Math.random();
    return await get(url);
  },
  vnstat: async (id) => {
    const url = '/api/server/vnstat?id=' + id + '&_=' + Math.random();
    return await get(url);
  }
};
