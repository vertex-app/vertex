<template>
  <el-container style="height: 100vh;">
    <el-aside style="width: fit-content;">
      <el-menu :default-active="menuIndex" @select="selectMenu" class="admin-menu" :collapse="isCollapse">
        <div :style="`line-height: 0; height: ${isCollapse ? 64 : 200}px`">
          <el-image
            :style="`width: ${isCollapse ? 24 : 160}px; height: ${isCollapse ? 24 : 160}px; top: 20px; left: 20px`"
            src="/assets/images/weilai.jpg"
            fit="fill"></el-image>
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
      this.$goto(idx, this.$router);
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
        icon: ['fas', 'sliders-h'],
        title: ' 全局设置',
        path: '/setting'
      }, {
        icon: ['fas', 'server'],
        title: ' 服务器',
        path: '/server'
      }, {
        icon: ['fas', 'server'],
        title: ' 客户端',
        path: '/client'
      }, {
        icon: ['fas', 'rss'],
        title: ' Rss',
        path: '/rss'
      }, {
        icon: ['fas', 'trash-alt'],
        title: ' 删种规则',
        path: '/delete-rule'
      }, {
        icon: ['fas', 'rss-square'],
        title: ' Rss 规则',
        path: '/rss-rule'
      }, {
        icon: ['fas', 'magnet'],
        title: ' 种子聚合',
        path: '/torrent-mix'
      }, {
        icon: ['fas', 'magnet'],
        title: ' 种子历史',
        path: '/torrent-history'
      }, {
        icon: ['fab', 'telegram-plane'],
        title: ' Telegram',
        path: '/telegram'
      }, {
        icon: ['fas', 'sticky-note'],
        title: ' 日志',
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
    background-color: #FFFFFF;
    color: #FFFFFF;
    text-align: center;
    line-height: 60px;
  }

.el-aside {
  background-color: rgba(225,255,255, 0.2);
  color: #FFFFFF;
  text-align: center;
  line-height: 200px;
  height: 100vh;
}

.el-main {
  background-color: rgba(225,255,255, 0.2);
  text-align: center;
  overflow-x: hidden;
  overflow-y: auto;
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
  height: 100vh;
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
