const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const outputDir = path.join(__dirname, 'public/assets/styles');
fs.mkdirSync(outputDir, { recursive: true });

for (const theme of ['dark', 'light', 'cyber']) {
  const output = path.join(outputDir, `${theme}.less`);
  fs.rmSync(output, { force: true });
  const result = spawnSync(process.execPath, [path.join(__dirname, `${theme}.js`)], {
    cwd: __dirname,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  // The generator catches some compilation failures without rejecting its promise.
  if (result.error || result.status !== 0 || /Error occurred compiling file|^error /m.test((result.stdout || '') + (result.stderr || ''))) {
    throw result.error || new Error(`主题编译失败: ${theme}`);
  }
  if (!fs.existsSync(output) || !fs.statSync(output).size) {
    throw new Error(`主题文件未生成或为空: ${theme}.less`);
  }
}

fs.appendFileSync(path.join(outputDir, 'cyber.less'), `
@import url(/api/setting/getBackground.less);
.body-bg {
  background: @vt-bg-image;
  background-position-x: center;
  background-position-y: center;
  background-size: cover;
}
.login-layout {
  background: @body-background;
}
`);
fs.writeFileSync(path.join(outputDir, 'follow.less'), '\n');
