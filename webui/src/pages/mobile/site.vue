<template>
  <div class="mobile-site">
    <el-card v-for="(item, index) of siteList" :key="index" style="margin: 20px; position: relative;">
      <div style="height: 96px;">
        <div :style="`margin: 0; position: absolute; ${index % 2 === 0 ? 'left' : 'right'}: 2%; top: 0; padding: 4px; font-size: 12px;`">
          <div style="height: 24px; font-size: 18px; color: #FFB6C1"> {{item.name}}</div>
          <div style="height: 24px; font-size: 16px; color: green"> {{item.username}}</div>
          <div style="font-size: 13px;">{{$formatSize(item.upload)}} ↑</div>
          <div style="font-size: 13px;">{{$formatSize(item.download)}} ↓</div>
        </div>
        <div :style="`margin: 0; position: absolute; ${index % 2 === 0 ? 'right' : 'left'}: 2%; top: 32px; padding: 4px; font-size: 12px;`">
          <div>本日上传 {{$formatSize(increase.today[item.name].upload)}}</div>
          <div>本周上传 {{$formatSize(increase.week[item.name].upload)}}</div>
          <div>本月上传 {{$formatSize(increase.month[item.name].upload)}}</div>
        </div>
      </div>
      <!--
      <div style="height: 16px;">
        <div :style="`transition: 0.5s; font-size: 12px; position: absolute; right: 16px; bottom: 4px; ${ expand[item.id] === 1 ? 'transform: rotate(180deg)' : '' }`">
          <fa :style="`font-size: 12px; color: grey;`" :icon="['fas', 'angle-down']"></fa>
        </div>
      </div>
      <div :style="`transition: 0.5s; overflow-y: scroll; height: ${ expand[item.id] ? '400px;' : '0' }`">
        <div v-for="(torrent, index) of torrents[item.id]" :key="torrent.hash" style="margin: 0; font-size: 12px; width: 100%; position: relative;">
          <div :style="`transform: scale(0.8); width: 120%; left: -10%; position: absolute; top: ${64 * index}px;`">
            <span style="color: #FFB6C1">[{{ torrent.category }}] </span>
            <span style="color: #FFB6C1">[{{ torrent.tracker }}] </span>
            <br>
            <span style="color: green"> {{$formatSize(torrent.uploadSpeed)}}/s ↑ </span>
            <span style="color: red"> {{$formatSize(torrent.downloadSpeed)}}/s ↓ </span>
            <span> || </span>
            <span style="color: green"> {{$formatSize(torrent.uploaded)}} ↑ </span>
            <span style="color: red"> {{$formatSize(torrent.downloaded)}} ↓ </span>
            <div style="height: 4px;"></div>
            <span style="word-break: break-all;">{{ torrent.name }}</span>
            <div style="height: 2px; background: red; margin: 2px 0;"></div>
          </div>
        </div>
      </div>
      -->
    </el-card>
  </div>
</template>

<script>
export default {
  data () {
    return {
      siteList: [],
      increase: {
        week: {},
        month: {},
        today: {}
      }
    };
  },
  methods: {
    async listSite () {
      const res = await this.$axiosGet('/api/site/list?_=' + Math.random());
      this.siteList = res ? res.data.siteList.sort((a, b) => b.upload - a.upload) : [];
      this.increase = res ? res.data.increase : this.increase;
    },
  },
  async mounted () {
    await this.listSite();
  }
};
</script>

<style scoped>
</style>
