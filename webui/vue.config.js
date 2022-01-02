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
  chainWebpack: config =>{
    config.plugin('html')
      .tap(args => {
        args[0].title = 'Vertex';
        return args;
      });
  }
};
