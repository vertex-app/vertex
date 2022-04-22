const requestPromise = require('util').promisify(require('request'));
const { JSDOM } = require('jsdom');

const getDocument = async function (url, cookie) {
  const html = (await requestPromise({
    url,
    headers: {
      cookie
    }
  })).body;
  const dom = new JSDOM(html);
  return dom.window.document;
};

const _free = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  if (d.body.innerHTML.indexOf('userdetails') === -1) {
    throw new Error('疑似登陆状态失效, 请检查 Cookie');
  }
  const state = d.querySelector('#top font[class]');
  return state && ['free', 'twoupfree'].indexOf(state.className) !== -1;
};

const _freeOpencd = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  if (d.body.innerHTML.indexOf('userdetails') === -1) {
    throw new Error('疑似登陆状态失效, 请检查 Cookie');
  }
  const state = d.querySelector('div[class=title] img[class]');
  return state && ['pro_free', 'pro_twoupfree'].indexOf(state.className) !== -1;
};

const _freeHDChina = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  if (d.body.innerHTML.indexOf('userdetails') === -1) {
    throw new Error('疑似登陆状态失效, 请检查 Cookie');
  }
  const tid = url.match(/id=(\d*)/)[1];
  const csrf = d.querySelector('meta[name=x-csrf]').content;
  const promotion = await requestPromise({
    url: 'https://hdchina.org/ajax_promotion.php',
    method: 'POST',
    headers: {
      cookie
    },
    formData: {
      'ids[]': tid,
      csrf
    },
    json: true
  });
  return promotion.body.message[tid].sp_state.indexOf('pro_free') !== -1 || promotion.body.message[tid].sp_state.indexOf('pro_twoupfree') !== -1;
};

const _freeToTheGlory = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  if (d.body.innerHTML.indexOf('userdetails') === -1) {
    throw new Error('疑似登陆状态失效, 请检查 Cookie');
  }
  const state = d.querySelector('img[src="/pic/ico_free.gif"][class="topic"]');
  return state;
};

const _freeDmhy = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  if (d.body.innerHTML.indexOf('userdetails') === -1) {
    throw new Error('疑似登陆状态失效, 请检查 Cookie');
  }
  const state = d.querySelector('td[valign=top] img[class=pro_free2up]') ||
    d.querySelector('td[valign=top] img[class=pro_free]') ||
    (d.querySelector('td[valign=top] img[class=arrowdown]') && d.querySelector('td[valign=top] img[class=arrowdown]').nextSibling.innerHTML === '0.00X');
  return state;
};

const _freeHaresClub = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  if (d.body.innerHTML.indexOf('userdetails') === -1) {
    throw new Error('疑似登陆状态失效, 请检查 Cookie');
  }
  const state = d.querySelector('b font[class]');
  return state && ['free', 'twoupfree'].indexOf(state.className) !== -1;
};

const _freeHDBits = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  if (d.body.innerHTML.indexOf('userdetails') === -1) {
    throw new Error('疑似登陆状态失效, 请检查 Cookie');
  }
  const state = d.querySelector('span[class="tag freeleech"]');
  return state;
};

const freeWrapper = {
  'pterclub.com': _free,
  'pt.btschool.club': _free,
  'club.hares.top': _freeHaresClub,
  'hdhome.org': _free,
  'springsunday.net': _free,
  'hdsky.me': _free,
  'ourbits.club': _free,
  'chdbits.co': _free,
  'audiences.me': _free,
  'www.hddolby.com': _free,
  'pthome.net': _free,
  'pt.soulvoice.club': _free,
  'et8.org': _free,
  'hdfans.org': _free,
  'www.nicept.net': _free,
  'kp.m-team.cc': _free,
  'open.cd': _freeOpencd,
  'www.open.cd': _freeOpencd,
  'totheglory.im': _freeToTheGlory,
  'u2.dmhy.org': _freeDmhy,
  'hdbits.org': _freeHDBits
};

const _hr = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  if (d.body.innerHTML.indexOf('userdetails') === -1) {
    throw new Error('疑似登陆状态失效, 请检查 Cookie');
  }
  const hr = d.querySelector('img[class=hitandrun]');
  return hr;
};

const _hrToTheGlory = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  if (d.body.innerHTML.indexOf('userdetails') === -1) {
    throw new Error('疑似登陆状态失效, 请检查 Cookie');
  }
  const hr = d.querySelector('img[src="/pic/hit_run.gif"][alt="Hit & Run"]');
  return hr;
};

const _hrToCHDBits = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  if (d.body.innerHTML.indexOf('userdetails') === -1) {
    throw new Error('疑似登陆状态失效, 请检查 Cookie');
  }
  const hr5 = d.body.innerHTML.indexOf('<b>H&amp;R:&nbsp;</b>5day</td></tr>');
  const hr3 = d.body.innerHTML.indexOf('<b>H&amp;R:&nbsp;</b>3day</td></tr>');
  return hr3 !== -1 || hr5 !== -1;
};

const hrWrapper = {
  'www.hddolby.com': _hr,
  'hdhome.org': _hr,
  'ourbits.club': _hr,
  'totheglory.im': _hrToTheGlory,
  'chdbits.co': _hrToCHDBits
};

exports.free = async (url, cookie) => {
  const host = new URL(url).host;
  if (freeWrapper[host]) {
    return await freeWrapper[host](url, cookie);
  }
  throw new Error(`暂不支持 ${host} 抓取免费, 请检查后重试.`);
};

exports.hr = async (url, cookie) => {
  const host = new URL(url).host;
  if (hrWrapper[host]) {
    return await hrWrapper[host](url, cookie);
  }
  throw new Error(`暂不支持 ${host} 抓取 HR, 请检查后重试.`);
};
