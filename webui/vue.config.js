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
        target: 'http://172.20.99.3:4000',
        changeOrigin: true,
        ws: true,
        pathRewrite: { '^/api': '/api' },
        secure: false
      },
      '/proxy/': {
        target: 'http://172.20.99.3:4000',
        changeOrigin: true,
        ws: true,
        pathRewrite: { '^/proxy': '/proxy' },
        secure: false
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
  },
  pwa: {
    name: 'VERTEX', // 名字
    themeColor: '#373737', // 背景颜色
    appleMobileWebAppCapable: true, // 苹果WebApp支持
    manifestPath: 'assets/manifest.json',
    appleMobileWebAppStatusBarStyle: 'black-translucent',
    // manifest 设置
    manifestOptions: {
      name: 'VERTEX',
      short_name: 'VERTEX',
      theme_color: '#373737',
      start_url: '/',
      display: 'standalone',
      background_color: '#000000',
      icons: require('./public/assets/pwaicons/icons.json').icons
    },

    // workbox
    workboxOptions: {
      swDest: 'service-worker.js'
    },

    // 图标
    iconPaths: {
      faviconSVG: 'assets/images/logo.svg',
      favicon32: 'assets/pwaicons/ios/32.png',
      favicon16: 'assets/pwaicons/ios/16.png',
      appleTouchIcon: 'assets/pwaicons/ios/512.png',
      maskIcon: '',
      msTileImage: ''
    }
  }
};
