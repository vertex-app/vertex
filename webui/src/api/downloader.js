import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/downloader/list';
    return await get(url);
  },
  listMainInfo: async () => {
    const url = '/api/downloader/listMainInfo?_=' + Math.random();
    return await get(url);
  },
  modify: async (downloader) => {
    const url = '/api/downloader/' + (downloader.id ? 'modify' : 'add');
    return await post(url, downloader);
  },
  delete: async (id) => {
    const url = '/api/downloader/delete';
    return await post(url, { id });
  },
  getLogs: async (id) => {
    const url = `/api/downloader/getLogs?client=${id}&_=` + Math.random();
    return await get(url);
  }
};
