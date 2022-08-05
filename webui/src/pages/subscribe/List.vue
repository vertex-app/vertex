<template>
  <div style="font-size: 24px; font-weight: bold;">订阅列表</div>
  <a-divider></a-divider>
  <div class="subscribe-list">
    <div
      v-for="item of items"
      :key="'' + item.id + item.doubanId"
      :style="`display: inline-block; margin: 12px; text-align: center; width: ${isMobile() ? '160px' : '200px'}; vertical-align: top;`">
      <div :class="isMobile() ? 'item-class-mobile' : 'item-class-pc'">
        <img v-lazy="item.poster" @click="gotoDetail(item)" style="cursor: pointer; width: 100%; height: 100%;">
        <div style="color: lightpink; bottom: 0px; width: 100%; position: absolute; background-color: rgba(0,0,0,0.3); backdrop-filter: blur(4px);">
          <span>[{{item.tag}}]</span>
          <span>[{{item.episodeNow === 0 ? 0 : item.episodeNow || '1'}}/{{item.episodes === 0 ? 0 : item.episodes || '1'}}]</span>
        </div>
        <div class="top-right" @click="del(item)">
        </div>
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
      items: []
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
    async list () {
      try {
        this.items = (await this.$api().subscribe.listSubscribeItem()).data.wishes;
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
  border-radius: 4px;
  overflow: hidden;
  font-size: 14px;
}

.item-class-mobile {
  width: 160px;
  height: 224px;
  position: relative;
  border-radius: 4px;
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
  border-width: 64px;
}

.top-right::after {
  content: '删除';
  transform: rotate(45deg);
  font-size: 16px;
  color: #E87A90;
  right: 0px;
  top: 0px;
  width: 64px;
  height: 20px;
  margin-top: 10px;
  margin-right: -12px;
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
}
</style>
