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
    async getBackground () {
      const res = await this.$axiosGet('/api/setting/getBackground');
      document.body.style.background = res.data ? `url(${res.data})` : 'url(\'/assets/images/background.jpg\')';
      document.body.style.backgroundPositionX = 'center';
      document.body.style.backgroundPositionY = 'center';
      document.body.style.backgroundSize = 'cover';
    }
  },
  created () {
    this.getBackground();
  }
};
</script>

<style>
body {
  height: 100vh;
  background-position-x: center;
  background-size: cover;
}

@font-face{
  font-family: 'consolas';
  src: url('/assets/fonts/consolas.woff');
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

.el-table__expand-icon {
  width: 72px;
  height: 48px;
  padding-left: 0;
  padding-right: 0;
 }

.el-table__expand-column .cell {
  width: 72px;
  height: 48px;
  padding-left: 0;
  padding-right: 0;
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

*::-webkit-scrollbar {
  width : 7px;
  height: 10px;
}

*::-webkit-scrollbar-track {
  box-shadow   : inset 0 0 5px rgba(0, 0, 0, 0.2);
  background   : #ededed;
  border-radius: 10px;
}
</style>
