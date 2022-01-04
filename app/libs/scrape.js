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
  const state = d.querySelector('#top font[class]');
  return state && ['free', 'twoupfree'].indexOf(state.className) !== -1;
};

const _freeOpencd = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  const state = d.querySelector('div[class=title] img[class]');
  return state && ['pro_free', 'pro_twoupfree'].indexOf(state.className) !== -1;
};

const _freeHDChina = async function (url, cookie) {
  const d = await getDocument(url, cookie);
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

const freeWrapper = {
  'pterclub.com': _free,
  'pt.btschool.club': _free,
  'club.hares.top': _free,
  'hdhome.org': _free,
  'springsunday.net': _free,
  'hdsky.me': _free,
  'ourbits.club': _free,
  'chdbits.co': _free,
  'audiences.me': _free,
  'www.hddolby.com': _free,
  'pthome.net': _free,
  'hdchina.org': _freeHDChina,
  'open.cd': _freeOpencd
};

const _hr = async function (url, cookie) {
  const d = await getDocument(url, cookie);
  const hr = d.querySelector('img[class=hitandrun]');
  return hr;
};

const hrWrapper = {
  'www.hddolby.com': _hr
};

exports.free = async (url, cookie) => {
  const host = new URL(url).host;
  if (freeWrapper[host]) {
    return await freeWrapper[host](url, cookie);
  }
  throw new Error(`暂不支持 ${host}, 请检查后重试.`);
};

exports.hr = async (url, cookie) => {
  const host = new URL(url).host;
  if (hrWrapper[host]) {
    return await hrWrapper[host](url, cookie);
  }
  throw new Error(`暂不支持 ${host}, 请检查后重试.`);
};
