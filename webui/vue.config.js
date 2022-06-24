module.exports = {
  publicPath: '/',
  outputDir: '../app/static',
  assetsDir: 'assets',
  devServer: {
    port: '8080',
    host: '0.0.0.0',
    disableHostCheck: true,
    https: false,
    open: true,
    proxy: {
      '/api/': {
        target: 'http://172.20.99.3:3000',
        changeOrigin: true,
        ws: true,
        pathRewrite: { '^/api': '/api' },
        secure: false
      },
      '/proxy/': {
        target: 'http://172.20.99.3:3000',
        changeOrigin: true,
        ws: false,
        pathRewrite: { '^/proxy': '/proxy' },
        secure: false
      }
    }
  },
  css: {
    loaderOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },
  chainWebpack: config => {
    config.plugin('html')
      .tap(args => {
        args[0].title = 'Vertex';
        return args;
      });
    const { execSync } = require('child_process');
    const moment = require('moment');
    config.plugin('define').tap((args) => {
      args[0]['process.env'].version = JSON.stringify({
        updateTime: moment(execSync('git log --pretty=format:%at -1').toString().trim() * 1000).utcOffset(8).format('YYYY-MM-DD HH:mm:ss'),
        head: execSync('git rev-parse HEAD').toString().trim().substring(0, 12),
        commitInfo: execSync('git log --pretty=format:%s -1').toString().trim(),
        version: execSync('git describe --tags').toString().trim().split('-')[0]
      });
      return args;
    });
  }
};
