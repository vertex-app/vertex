import { get, post } from '../util/axios';

export default {
  info: async (hash) => {
    const url = '/api/torrent/info?hash=' + hash;
    return await get(url);
  },
  link: async (body) => {
    const url = '/api/torrent/link';
    return await post(url, body);
  },
  list: async (qs) => {
    const qsString = Object.keys(qs).filter(item => qs[item]).map(item => `${item}=${encodeURIComponent(qs[item])}`).join('&');
    const url = `/api/torrent/list?${qsString}`;
    return await get(url);
  },
  getBulkLinkList: async (keyword, client) => {
    const url = `/api/torrent/getBulkLinkList?keyword=${keyword || ''}&client=${client || ''}`;
    return await get(url);
  },
  scrapeName: async (name, type) => {
    const url = `/api/torrent/scrapeName?name=${name || ''}&type=${type || ''}`;
    return await get(url);
  },
  listHistory: async (qs) => {
    const qsString = Object.keys(qs).map(item => `${item}=${encodeURIComponent(qs[item])}`).join('&');
    const url = `/api/torrent/listHistory?${qsString}`;
    return await get(url);
  },
  getDelInfo: async (qs) => {
    const qsString = Object.keys(qs).map(item => `${item}=${encodeURIComponent(qs[item])}`).join('&');
    const url = `/api/torrent/getDelInfo?${qsString}`;
    return await get(url);
  },
  deleteTorrent: async (body) => {
    const url = '/api/torrent/deleteTorrent';
    return await post(url, body);
  }
};
