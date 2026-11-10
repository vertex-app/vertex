const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

test('theme preparation rejects silently reported compiler failures and stale output', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vertex-theme-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.copyFileSync(path.resolve(__dirname, '../webui/prepare-themes.js'), directory + '/prepare-themes.js');
  for (const theme of ['dark', 'light', 'cyber']) {
    fs.writeFileSync(`${directory}/${theme}.js`, `require('fs').writeFileSync('public/assets/styles/${theme}.less', '.theme { color: red; }');`);
  }
  const run = () => spawnSync(process.execPath, [directory + '/prepare-themes.js'], { encoding: 'utf8' });
  assert.equal(run().status, 0);
  const output = fs.readFileSync(directory + '/public/assets/styles/cyber.less', 'utf8');
  assert.equal(run().status, 0);
  assert.equal(fs.readFileSync(directory + '/public/assets/styles/cyber.less', 'utf8'), output);
  fs.writeFileSync(directory + '/dark.js', 'console.error("Error occurred compiling file dark.less");');
  assert.notEqual(run().status, 0);
  fs.writeFileSync(directory + '/dark.js', '');
  assert.notEqual(run().status, 0);
});
