const util = require('../util');
const logger = require('./logger');
const pushConfig = global.pushConfig;

const pushIyuu = async function (text, desp) {
  const option = {
    url: `https://iyuu.cn/${pushConfig.iyuu.token}.send`,
    method: 'POST',
    formData: {
      text,
      desp
    }
  };
  const res = await util.requestPromise(option);
  if (res.body.errcode !== 0) {
    logger.error('推送失败', text, ': ', res.body);
  }
};

const pushWrapper = {
  iyuu: pushIyuu
};

exports.push = async function (text, desp, type) {
  await pushWrapper[type](text, desp);
};
