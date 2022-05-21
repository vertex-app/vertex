<template>
  <el-container style="height: calc(var(--vh, 1vh) * 100);">
    <el-aside style="width: fit-content;">
      <el-menu :default-active="menuIndex" @select="selectMenu" class="admin-menu" :collapse="isCollapse">
        <div :style="`line-height: 0; width: ${isCollapse ? '64px' : '144px; margin: 0 28px'}`" class="logo">
          <div style="margin: 20px">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0.4385022521018982 -0.000009216904800268821 101.5615005493164 99.98497772216797"><path d="M69.3 59.41l-9.89 9.89L51 77.73 30.46 98.26A6 6 0 0 1 22 89.83L42.56 69.3 51 60.88l9.9-9.9zM102 24.28a6 6 0 0 1-1.75 4.21L77.72 51l-8.42-8.44 22.5-22.5a6 6 0 0 1 10.2 4.22z" fill="#0059cc"></path><path d="M83.64 6a5.94 5.94 0 0 1-1.74 4.21L41.08 51l-8.42-8.42 9.9-9.89L51 24.24 73.48 1.75A6 6 0 0 1 83.64 6zM32.66 59.41L12.13 79.93a6 6 0 0 1-8.42-8.42L24.24 51z" fill="#00dac7"></path><path d="M51 24.24l-8.42 8.43-22.5-22.5A6 6 0 0 1 24.28 0a5.89 5.89 0 0 1 4.2 1.75zM98.25 79.93a5.94 5.94 0 0 1-8.42 0L51 41.09l8.42-8.42 9.9 9.89 8.4 8.44 20.53 20.51a6 6 0 0 1 0 8.42z" fill="#00baec"></path><path d="M51 60.88l-8.44 8.42L1.74 28.49a6 6 0 0 1 8.43-8.43l22.49 22.5L41.08 51zM79.93 98.26a6 6 0 0 1-8.42 0L51 77.73l8.42-8.43 20.51 20.53a6 6 0 0 1 0 8.43z" fill="#00abd8"></path></svg>
          </div>
        </div>
        <el-menu-item v-for="(item, idx) of menus" :key="idx" :index="item.path">
          <fa :icon="item.icon"></fa>
          <span slot="title">{{item.title}}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="text-align: right;">
        <i :class="`${isCollapse ? 'el-icon-right' : 'el-icon-back'} menu-collapse`" @click="collapseChange"></i>
        <el-button type="danger" size="mini" @click="logout">退出</el-button>
      </el-header>
        <el-main>
          <router-view></router-view>
        </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  components: {
  },
  data () {
    return {
      isCollapse: false,
      menus: [],
      menuIndex: ''
    };
  },
  methods: {
    collapseChange () {
      this.isCollapse = !this.isCollapse;
    },
    selectMenu (idx) {
      if (idx === '/mobile/home') {
        window.location.href = idx;
      } else {
        this.$goto(idx, this.$router);
      }
    },
    async logout () {
      const res = await this.$axiosGet('/api/user/logout');
      if (res) {
        window.location.href = '/login';
      }
    }
  },
  async mounted () {
    this.isCollapse = document.body.clientWidth < 1440;
    this.menus = [
      {
        icon: ['fas', 'home'],
        title: ' 主页',
        path: '/home'
      }, {
        icon: ['fas', 'chart-line'],
        title: ' 监控信息',
        path: '/monitor'
      }, {
        icon: ['fab', 'searchengin'],
        title: ' 站点聚合',
        path: '/site-mix/site-list'
      }, {
        icon: ['fas', 'rss'],
        title: ' 刷流工具',
        path: '/hit-and-run/torrent-mix'
      }, {
        icon: ['fas', 'server'],
        title: ' 下载服务',
        path: '/point/client'
      }, {
        icon: ['fas', 'tv'],
        title: ' 追光迷影',
        path: '/binge-watching/search-mix'
      }, {
        icon: ['fas', 'toolbox'],
        title: ' 常用工具',
        path: '/tools/network-test'
      }, {
        icon: ['fas', 'sliders-h'],
        title: ' 全局设置',
        path: '/global/setting'
      }, {
        icon: ['fas', 'sticky-note'],
        title: ' 系统日志',
        path: '/log'
      }, {
        icon: ['fas', 'mobile'],
        title: ' 手机端',
        path: '/mobile/home'
      }
    ];
    this.menuIndex = this.$route.path;
    window.onresize = () => {
      this.isCollapse = document.body.clientWidth < 1440;
    };
  }
};
</script>

<style scoped>
.el-header, .el-footer {
    text-align: center;
    line-height: 60px;
  }

.el-aside {
  text-align: center;
  line-height: 200px;
  height: calc(var(--vh, 1vh) * 100);
}

.el-main {
  height: calc(var(--vh, 1vh) * 100);
  text-align: center;
  overflow-y: auto;
}

.el-menu-item.is-active, .el-menu-item:hover {
  color: #409EFF;
}

body > .el-container {
  margin-bottom: 40px;
}

.el-container:nth-child(5) .el-aside,
.el-container:nth-child(6) .el-aside {
  line-height: 260px;
}

.el-container:nth-child(7) .el-aside {
  line-height: 100%;
}

.admin-menu {
  border-right: none;
  background: none;
  text-align: left;
}

.admin-menu:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}

.menu-collapse {
  color: #409eff;
  float: left;
  font-size: 32px;
  line-height: 60px;
  cursor: pointer;
}
</style>
