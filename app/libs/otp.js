const crypto = require('crypto');

function base32tohex (base32) {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let hex = '';
  for (let i = 0; i < base32.length; i++) {
    const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    bits += (Array(5).fill(0).join('') + val.toString(2)).slice(-5);
  }
  for (let i = 0; i < bits.length - 3; i += 4) {
    const chunk = bits.substr(i, 4);
    hex = hex + parseInt(chunk, 2).toString(16);
  }
  return hex;
};

function get (secret, offset = 0) {
  const mssg = Buffer.from((Array(16).fill(0).join('') + (Math.floor(Math.round(new Date().getTime() / 1000) / 30) + offset).toString(16)).slice(-16), 'hex');
  const key = Buffer.from(base32tohex(secret), 'hex');
  let hmac = crypto.createHmac('sha1', key);
  hmac.setEncoding('hex');
  hmac.update(mssg);
  hmac.end();
  hmac = hmac.read();
  return ((parseInt((hmac.substr(parseInt(hmac.slice(-1), 16) * 2, 8)), 16) & 2147483647) + '').slice(-6);
};

function verify (secret, pw) {
  return pw === get(secret, 1) || pw === get(secret) || pw === get(secret, -1);
};

module.exports = {
  get,
  verify
};
