<template>
  <div id="app">
    <div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {
  },
  data () {
    return {
    };
  },
  methods: {
  }
};
</script>

<style>
@font-face{
  font-family: 'consolas';
  src: url('/assets/fonts/consolas.woff');
}

body {
  background: #e3f9fd;
}

#app {
  font-family: consolas,"Microsoft YaHei","微软雅黑","Hiragino Sans GB","Helvetica Neue",Helvetica,"PingFang SC",Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
  background: #e3f9fd;
}

.el-textarea__inner {
  font-family: 'consolas';
}
</style>
