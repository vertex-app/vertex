import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/subscribe/list';
    return await get(url);
  },
  modify: async (subscribe) => {
    const url = '/api/subscribe/' + (subscribe.id ? 'modify' : 'add');
    return await post(url, subscribe);
  },
  delete: async (id) => {
    const url = '/api/subscribe/delete';
    return await post(url, { id });
  },
  refreshSubscribe: async (id) => {
    const url = '/api/subscribe/refresh';
    return await post(url, { id });
  },
  listSubscribeItem: async () => {
    const url = '/api/subscribe/listWishes?length=9999&page=1';
    return await get(url);
  },
  getItem: async (id, douban) => {
    const url = `/api/subscribe/getWish?wishId=${id}&doubanId=${douban}`;
    return await get(url);
  },
  refreshItem: async (id, douban) => {
    const url = `/api/subscribe/refreshWish?id=${id}&douban=${douban}`;
    return await get(url);
  },
  deleteItem: async (id, douban) => {
    const url = `/api/subscribe/deleteWish?id=${id}&douban=${douban}`;
    return await get(url);
  },
  editItem: async (wish) => {
    const url = '/api/subscribe/editWish';
    return await post(url, wish);
  }
};