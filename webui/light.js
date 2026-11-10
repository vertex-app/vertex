const path = require('path');

const { generateTheme, getLessVars } = require('antd-theme-generator');
// const lessPath = './public/assets/styles/variables.less';

const paths = [
  {
    path: './src/style/light.less',
    output: './public/assets/styles/light.less'
  }
];
(async () => {
  for (const p of paths) {
    const lessPath = path.join(__dirname, p.path);
    await generateTheme({
      antDir: path.join(__dirname, './node_modules/ant-design-vue'), // node_modules中antd的路径
      stylesDir: [], // 主题变量由 varFile 提供，不将生成产物再次作为输入
      varFile: lessPath, // less变量的入口文件
      themeVariables: Object.keys(getLessVars(lessPath)), // 您要动态更改的变量列表
      outputFilePath: path.join(__dirname, p.output) // 生成的color.less文件的位置
      // customColorRegexArray: [/^color\(.*\)$/]
    }).then(res => {
      console.log('配置主题成功');
    });
  }
})().catch(err => {
  console.error('配置主题失败', err);
  process.exitCode = 1;
});
