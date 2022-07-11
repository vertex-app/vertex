<template>
  <el-container style="height: calc(var(--vh, 1vh) * 100);">
    <el-aside style="width: fit-content;">
      <el-menu :default-active="menuIndex" @select="selectMenu" class="admin-menu" :collapse="isCollapse">
        <div :style="`line-height: 0; width: ${isCollapse ? '64px' : '100px; margin: 0 10px'}`" class="logo">
          <div style="margin: 20px">
            <img src="/assets/images/logo.svg"/>
          </div>
        </div>
        <el-menu-item v-for="(item, idx) of menus" :key="idx" :index="item.path">
          <fa :icon="item.icon" style="width: 20px;"></fa>
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
        icon: ['fas', 'mobile'],
        title: ' 手机端',
        path: '/mobile/home'
      }, {
        icon: ['fas', 'sticky-note'],
        title: ' 系统日志',
        path: '/log'
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
  width: 120px;
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
