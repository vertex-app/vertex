import { get, post } from '../util/axios';
import md5 from 'md5-node';

export default {
  login: async (username, password, otpPw) => {
    const url = '/api/user/login';
    const body = {
      username,
      password: md5(password),
      otpPw: otpPw
    };
    return await post(url, body);
  },
  get: async () => {
    const url = '/api/user/get';
    return await get(url);
  }
};
