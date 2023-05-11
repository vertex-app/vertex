<template>
  <div style="font-size: 24px; font-weight: bold;">订阅列表</div>
  <a-divider></a-divider>
  <div>
    <a-space>
      <span>类型</span>
      <a-select v-model:value="type" style="width: 96px" size="small" @change="doFilte">
        <a-select-option value="all">全部</a-select-option>
        <a-select-option value="movie">电影</a-select-option>
        <a-select-option value="series">剧集</a-select-option>
      </a-select>
      <span>状态</span>
      <a-select v-model:value="status" style="width: 96px" size="small" @change="doFilte">
        <a-select-option value="all">全部</a-select-option>
        <a-select-option value="complete">已完成</a-select-option>
        <a-select-option value="uncomplete">未完成</a-select-option>
      </a-select>
    </a-space>
  </div>
  <a-divider></a-divider>
  <div class="subscribe-list">
    <div
      v-for="item of filteredItems"
      :key="'' + item.id + item.doubanId"
      :style="`display: inline-block; margin: 12px; text-align: center; width: ${isMobile() ? '160px' : '200px'}; vertical-align: top;`">
      <div :class="isMobile() ? 'item-class-mobile' : 'item-class-pc'">
        <img v-lazy="item.poster" @click="gotoDetail(item)" style="cursor: pointer; width: 100%; height: 100%;">
        <div style="color: lightpink; bottom: 0px; width: 100%; position: absolute; background-color: rgba(0,0,0,0.3); backdrop-filter: blur(4px);">
          <a-popover title="刷新?" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
            <template #content>
              <a-button type="primary" @click="refreshItem(item)" size="small">刷新</a-button>
            </template>
            <fa style="position: absolute; left: 6px; font-size: 14px; color: cyan; bottom: 3px; cursor: pointer;" :icon="['fas', 'arrow-rotate-right']"></fa>
          </a-popover>
          <span>[{{item.tag}}]</span>
          <span>[{{+item.episodeNow === 0 ? 0 : (item.episodeNow || '1')}}/{{+item.episodes === 0 ? 0 : (item.episodes || '1')}}]</span>
          <a-popover title="删除?" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
            <template #content>
              <a-button type="primary" danger @click="del(item)" size="small">删除</a-button>
            </template>
            <fa style="position: absolute; right: 6px; font-size: 14px; color: red; bottom: 3px; cursor: pointer;" :icon="['fas', 'times']"></fa>
          </a-popover>
        </div>
        <!-- <div class="top-right" @click="del(item)"> -->
      </div>
      <div style="margin: 6px auto; max-width: 100%;" v-if="isMobile()">
        <div style="height: 48px;">
          <fa v-if="item.downloaded" style="font-size: 16px; color: green;" :icon="['fas', 'check']"></fa>
          {{item.name.split('/')[0]}}
        </div>
      </div>
      <div style="margin: 6px auto;" v-if="!isMobile()">
        <div style="height: 48px;">
          <fa v-if="item.downloaded" style="font-size: 16px; color: green;" :icon="['fas', 'check']"></fa>
          {{item.name.split('/')[0]}} · {{item.year}}
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      items: [],
      status: 'uncomplete',
      type: 'all',
      filteredItems: []
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
    doFilte () {
      let filteredItems = this.items;
      if (this.type === 'movie') {
        filteredItems = filteredItems.filter(item => !item.episodes);
      }
      if (this.type === 'series') {
        filteredItems = filteredItems.filter(item => item.episodes);
      }
      if (this.status === 'complete') {
        filteredItems = filteredItems.filter(item => item.downloaded);
      }
      if (this.status === 'uncomplete') {
        filteredItems = filteredItems.filter(item => !item.downloaded);
      }
      this.filteredItems = filteredItems;
    },
    async list () {
      try {
        this.items = (await this.$api().subscribe.listSubscribeItem()).data.wishes;
        this.doFilte();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async gotoDetail (item) {
      this.$goto(`/subscribe/detail/${item.doubanId}/${item.id}`, this.$router);
    },
    async del (item) {
      try {
        await this.$api().subscribe.deleteItem(item.id, item.doubanId);
        this.$message().success('删除成功!');
        this.list();
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async refreshItem (item) {
      try {
        await this.$api().subscribe.refreshItem(item.id, item.doubanId);
        await this.$message().success('刷新成功!');
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    this.list();
  }
};
</script>
<style scoped>
.subscribe-list {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: center;
}

.item-class-pc {
  width: 200px;
  height: 280px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

.item-class-mobile {
  width: 160px;
  height: 224px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

.top-right {
  pointer-events: none;
}

.top-right::before {
  content: '';
  right: 0px;
  top: 0px;
  width: 0;
  height: 0;
  position: absolute;
  border-top: rgba(255,255,255,0.8) solid 1px;
  border-left: transparent solid;
  border-width: 32px;
}

.top-right::after {
  content: 'X';
  transform: rotate(45deg);
  font-size: 16px;
  color: #E87A90;
  right: 0px;
  top: 0px;
  width: 32px;
  height: 20px;
  margin-top: 0;
  margin-right: -7px;
  font-weight: bold;
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
}
</style>
