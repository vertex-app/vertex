const request = require('util').promisify(require('request'));

(async () => {
  const { body } = await request({
    url: 'https://kp.m-team.cc/index.php',
    method: 'GET',
    headers: {
      cookie: process.argv[3],
      'user-agent': process.argv[2]
    }
  });
  const username = body.match(/userdetails.*?<b>(.*)<\/b>/);
  if (username) {
    console.log('无需登录', username[1], '使用已有 Cookie 即可');
    return;
  }
  if (body.indexOf('M-Team') === -1) {
    console.log('疑似遇到 5s 盾, 请手动获取 Cookie 并重试.');
    return;
  }
  const { headers } = await request({
    url: 'https://kp.m-team.cc/verify.php?returnto=%2F',
    method: 'POST',
    headers: {
      cookie: process.argv[3],
      'user-agent': process.argv[2]
    },
    formData: {
      otp: process.argv[4]
    }
  });
  if (headers.location === 'https://kp.m-team.cc/') {
    console.log('登录成功');
  } else {
    console.log('登录失败, 请重试');
  }
})();
