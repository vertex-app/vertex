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
  background: url('https://pic.lswl.in/images/2021/12/07/c776ce8578a92ee3d340f55651c6433a.jpg');
}

#app {
  font-family: consolas, "Microsoft YaHei","微软雅黑","Hiragino Sans GB","Helvetica Neue",Helvetica,"PingFang SC",Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

.el-textarea__inner {
  font-family: 'consolas';
}
</style>
