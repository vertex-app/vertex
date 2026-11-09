const fs = require('fs');
const path = require('path');

const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const packageVersion = require('../../webui/package.json').version;
const timestamp = event.head_commit?.timestamp || event.pull_request?.updated_at || new Date().toISOString();
const updateTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
}).format(new Date(timestamp));
const version = {
  updateTime,
  head: process.env.GITHUB_SHA.slice(0, 12),
  commitInfo: event.head_commit?.message || event.pull_request?.title || 'GitHub Actions 构建',
  version: process.env.GITHUB_REF.startsWith('refs/tags/')
    ? process.env.GITHUB_REF.slice('refs/tags/'.length).replace(/^v/, '')
    : packageVersion
};

fs.appendFileSync(path.resolve(process.env.GITHUB_ENV), `VERTEX_BUILD_VERSION=${JSON.stringify(version)}\n`);
