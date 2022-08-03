import axios from 'axios';

const get = async (url) => {
  try {
    const res = await axios.get(url, {
      validateStatus: () => true
    });
    if (!res.data.success) {
      throw new Error(res.data.message);
    }
    return res.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

const post = async (url, json) => {
  try {
    const res = await axios.post(url, json, {
      validateStatus: () => true
    });
    if (!res.data.success) {
      throw new Error(res.data.message);
    }
    return res.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export {
  get,
  post
};
