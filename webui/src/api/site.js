import { get, post } from '../util/axios';

export default {
  list: async () => {
    const url = '/api/site/list';
    return await get(url);
  },
  listRecord: async () => {
    const url = '/api/site/listRecord';
    return await get(url);
  },
  modify: async (site) => {
    const url = '/api/site/' + (site.id ? 'modify' : 'add');
    return await post(url, site);
  },
  delete: async (name) => {
    const url = '/api/site/delete';
    return await post(url, { name });
  },
  refresh: async (name) => {
    const url = `/api/site/refresh${name ? '?name=' + name : ''}`;
    return await get(url);
  },
  search: async (keyword, sites) => {
    const url = `/api/site/search?keyword=${keyword}&sites=${encodeURIComponent(JSON.stringify(sites))}`;
    return await get(url);
  },
  pushTorrent: async (body) => {
    const url = '/api/site/pushTorrent';
    return await post(url, body);
  },
  listSite: async (qs) => {
    const qsString = Object.keys(qs).filter(item => qs[item]).map(item => `${item}=${encodeURIComponent(qs[item])}`).join('&');
    const url = `/api/site/listSite?${qsString}`;
    return await get(url);
  }
};
