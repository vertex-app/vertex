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
  background: url('https://pic.lswl.in/images/2022/01/20/0477a2b150b8d7d13335d30b12c840f2.jpg');
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

.el-table {
  width: auto;
}

*::-webkit-scrollbar {
  width : 10px;
  height: 1px;
}
*::-webkit-scrollbar-thumb {
  border-radius   : 10px;
  background-color: skyblue;
  background-image: -webkit-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.2) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.2) 75%,
      transparent 75%,
      transparent
  );
}
*::-webkit-scrollbar-track {
  box-shadow   : inset 0 0 5px rgba(0, 0, 0, 0.2);
  background   : #ededed;
  border-radius: 10px;
}
</style>
