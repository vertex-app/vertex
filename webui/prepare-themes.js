const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const outputDir = path.join(__dirname, 'public/assets/styles');
fs.mkdirSync(outputDir, { recursive: true });

for (const theme of ['dark', 'light', 'cyber']) {
  const output = path.join(outputDir, `${theme}.less`);
  fs.rmSync(output, { force: true });
  execFileSync(process.execPath, [path.join(__dirname, `${theme}.js`)], {
    cwd: __dirname,
    stdio: 'inherit'
  });
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
