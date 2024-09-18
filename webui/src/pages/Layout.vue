<template>
  <a-layout class="dashboard">
    <a-layout-sider
      v-if="!isMobile()"
      theme="light">
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        mode="inline"
        style="height: calc(var(--vh, 1vh) * 100); overflow: auto; overflow-x: hidden; "
      >
        <div class="logo" @click="gotoWiki">
          <div style="width: 32px; float: left;">
            <img src="/assets/images/logo.svg"/>
          </div>
          <span style="font-size: 28px; line-height: 32px; padding-left: 12px;">
            Vertex
          </span>
        </div>
        <template v-for="item of menu">
          <a-menu-item v-if="!item.hidden && !item.sub" :key="item.path" @click="goto(item.path)">
            <template #icon>
              <fa :icon="item.icon" style="width: 32px;"></fa>
            </template>
            {{ item.title }}
          </a-menu-item>
          <a-sub-menu v-if="!item.hidden && item.sub" :key="item.path">
            <template #icon>
              <fa :icon="item.icon" style="width: 32px;"></fa>
            </template>
            <template #title>
              {{ item.title }}
            </template>
            <template v-for="subItem of item.sub" :key="subItem.path">
              <a-menu-item v-if="!subItem.hidden" @click="goto(subItem.path)" :key="subItem.path">
                <template #icon>
                  <fa :icon="subItem.icon" style="width: 32px;"></fa>
                </template>
                {{ subItem.title }}
              </a-menu-item>
            </template>
          </a-sub-menu>
        </template>
      </a-menu>
    </a-layout-sider>
    <a-drawer v-if="isMobile()" v-model:visible="visible" :closable="false" placement="left" width="272">
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        mode="inline"
        style="width: 220px; font-size: 14px; min-height: calc(var(--vh, 1vh) * 100 - 48px);"
      >
        <div class="logo">
          <div style="width: 32px; float: left;">
            <img src="/assets/images/logo.svg"/>
          </div>
          <span style="font-size: 22px; line-height: 32px; padding-left: 12px;">
            Vertex
          </span>
        </div>
        <template v-for="item of menu">
          <a-menu-item v-if="!item.hidden && !item.sub" :key="item.path" @click="goto(item.path); visible = false;">
            <template #icon>
              <fa :icon="item.icon" style="width: 32px;"></fa>
            </template>
            {{ item.title }}
          </a-menu-item>
          <a-sub-menu v-if="!item.hidden && item.sub" :key="item.path">
            <template #icon>
              <fa :icon="item.icon" style="width: 32px;"></fa>
            </template>
            <template #title>
              {{ item.title }}
            </template>
            <template v-for="subItem of item.sub" :key="subItem.path">
              <a-menu-item v-if="!subItem.hidden" @click="goto(subItem.path); visible = false;" :key="subItem.path">
                <template #icon>
                  <fa :icon="subItem.icon" style="width: 32px;"></fa>
                </template>
                {{ subItem.title }}
              </a-menu-item>
            </template>
          </a-sub-menu>
        </template>
      </a-menu>
    </a-drawer>
    <a-layout>
      <a-layout-header v-if="isMobile()" style="padding: 0;" theme="light">
        <fa v-if="!visible" :icon="['fas', 'bars']" @click="visible = !visible" style="font-size: 16px; padding-left: 16px;"/>
        <div style="margin: 0 auto; width: calc(100% - 32px); position: absolute; display: inline-block">
          <div style="margin: 0 auto; width: 144px;">
            <div style="width: 24px; float: left;">
              <img style="background: rgba(255,255,255,0.2); border-radius: 4px;" src="/assets/images/logo.svg"/>
            </div>
            <span style="font-size: 22px; padding-left: 6px; line-height: 68px;">
              Vertex
            </span>
          </div>
        </div>
      </a-layout-header>
      <a-layout-content
        :style="{ padding: '16px', 'overflow-y': 'auto', height: 'calc(var(--vh, 1vh) * 100 - 67px)' }">
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
<script>
export default {
  data () {
    return {
      selectedKeys: [],
      openKeys: [],
      visible: false,
      menu: []
    };
  },
  methods: {
    isMobile () {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
      } else {
        return false;
      }
    },
    async goto (to) {
      this.$goto(to, this.$router);
      setTimeout(() => {
        this.selectedKeys = [this.$route.path];
        const keys = [];
        for (const item of this.menu.filter(item => item.sub)) {
          if (this.$route.path.startsWith(item.path)) {
            keys.push(item.path);
          }
        }
        this.openKeys = keys;
      }, 100);
    },
    async gotoWiki () {
      window.open('https://wiki.vertex-app.top');
    }
  },
  async mounted () {
    this.selectedKeys = [this.$route.path];
    try {
      const res = await this.$api().user.get();
      this.$message().success('欢迎回来');
      this.menu = res.data.menu;
      const keys = [];
      for (const item of this.menu.filter(item => item.sub)) {
        if (this.$route.path.startsWith(item.path)) {
          keys.push(item.path);
        }
      }
      this.openKeys = keys;
    } catch (e) {
      this.$message().error(e.message);
    }
    /*
    window.less.modifyVars({
      'component-background': 'purple',
      'layout-body-background': 'purple'
    }).then((res) => {
      console.log('成功');
    }).catch((res) => {
      console.log('错误');
    });
    */
  }
};
</script>
<style scoped>
.logo {
  height: 32px;
  margin: 24px auto;
  width: 148px;
  cursor: pointer;
}

.user-badge {
  width: 148px;
  position: absolute;
  margin: 0 11.5px;
  bottom: 48px;
}

.dashboard {
  height: calc(var(--vh, 1vh) * 100);
}

.ant-menu:not(.ant-menu-horizontal) .ant-menu-item-selected {
  background: initial;
}
</style>
