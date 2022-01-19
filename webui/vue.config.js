module.exports = {
  publicPath: '/',
  outputDir: '../app/static',
  assetsDir: 'assets',
  devServer: {
    port: '8080',
    host: '0.0.0.0',
    https: false,
    open: true,
    proxy: {
      '/api/': {
        target: 'http://172.20.99.3:3000',
        changeOrigin: true,
        ws: false,
        pathRewrite: { '^/api': '/api' },
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
      args[0]['process.env'].version = JSON.stringify(moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '\nHEAD:' + execSync('git rev-parse HEAD').toString().trim().substring(0, 12) + '\nCOMMIT:' + execSync('git log --pretty=format:%s -1').toString().trim());
      return args;
    });
  }
};
