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
  },
  relink: async (qs) => {
    const qsString = Object.keys(qs).filter(item => qs[item]).map(item => `${item}=${encodeURIComponent(qs[item])}`).join('&');
    const url = `/api/subscribe/relink?${qsString}`;
    return await get(url);
  },
  delRecord: async (qs) => {
    const qsString = Object.keys(qs).filter(item => qs[item]).map(item => `${item}=${encodeURIComponent(qs[item])}`).join('&');
    const url = `/api/subscribe/deleteRecord?${qsString}`;
    return await get(url);
  },
  search: async (qs) => {
    const qsString = Object.keys(qs).filter(item => qs[item]).map(item => `${item}=${encodeURIComponent(qs[item])}`).join('&');
    const url = `/api/subscribe/search?${qsString}`;
    return await get(url);
  },
  addWish: async (wish) => {
    const url = '/api/subscribe/addWish';
    return await post(url, wish);
  }
};
