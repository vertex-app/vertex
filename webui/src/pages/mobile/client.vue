<template>
  <div class="mobile-client">
    <el-card @click.native="() => expandClient(item.id)" v-for="item of clientList" :key="item.id" style="margin: 20px; position: relative;">
      <div style="height: 32px; transform: scale(0.8);">
        <div style="margin: 0; position: absolute; left: -11.2%; top: 0px; padding: 4px; font-size: 10px;">
          <div> {{item.alias}} <div :style="`display: inline-block; width: 12px; height: 12px; border-radius: 6px; background: ${item.enable ? 'green' : 'red'};`"></div></div>
        </div>
        <div style="margin: 0; position: absolute; right: -11.2%; top: 0px; border-radius: 0 8px 0 8px; padding: 1px; font-size: 10px;">
          <div> 自动删种 <div :style="`display: inline-block; width: 12px; height: 12px; border-radius: 6px; background: ${item.autoDelete ? 'green' : 'red'};`"></div></div>
        </div>
      </div>
      <div style="height: 32px;">
        <div style="margin: 0; font-size: 12px; position: absolute; left: 0px; top: 32px; width: 100%;">
          <div style="transform: scale(0.8); width: 100%; left: -8%; position: absolute; top: 0">
            <div :style="`transition: width 2s; z-index:-1; position: absolute; top: 0; left: -2.75%; background: #7FFFAA; height: 14px; width: ${Math.min(item.uploadSpeed / maxSpeed * 1, 1) * 125}%`"></div>
            {{$formatSize(item.uploadSpeed)}}/s ↑
          </div>
          <div style="transform: scale(0.8); width: 100%; left: -8%; position: absolute; top: 14px;">
            <div :style="`transition: width 2s; z-index:-1; position: absolute; top: 0; left: -2.75%; background: red; height: 14px; width: ${Math.min(item.downloadSpeed / maxSpeed * 1, 1) * 125}%`"></div>
            {{$formatSize(item.downloadSpeed)}}/s ↓
          </div>
        </div>
        <div style="margin: 0; font-size: 12px; position: absolute; right: 0px; top: 32px;">
          <div style="transform: scale(0.8);"> {{$formatSize(item.allTimeUpload)}} ↑</div>
          <div style="transform: scale(0.8);"> {{$formatSize(item.allTimeDownload)}} ↓</div>
        </div>
      </div>
      <div style="height: 16px;">
        <div :style="`transition: 0.5s; font-size: 12px; position: absolute; right: 16px; bottom: 4px; ${ expand[item.id] === 1 ? 'transform: rotate(180deg)' : '' }`">
          <fa :style="`font-size: 12px; color: grey;`" :icon="['fas', 'angle-down']"></fa>
        </div>
      </div>
      <div :style="`transition: 0.5s; overflow-y: scroll; height: ${ expand[item.id] ? '400px;' : '0' }`">
        <div v-for="(torrent, index) of torrents[item.id]" :key="torrent.hash" style="margin: 0; font-size: 12px; width: 100%; position: relative;">
          <div :style="`transform: scale(0.8); width: 120%; left: -10%; position: absolute; top: ${64 * index}px;`">
            <span style="color: blue">[{{ torrent.category }}] </span>
            <span style="color: blue">[{{ torrent.tracker }}] </span>
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
    </el-card>
  </div>
</template>

<script>
export default {
  data () {
    return {
      clientList: [],
      maxSpeed: 1,
      expand: {},
      torrents: {}
    };
  },
  methods: {
    async listClient () {
      const res = await this.$axiosGet('/api/client/listMainInfo?_=' + Math.random());
      this.clientList = res ? res.data : [];
      for (const client of this.clientList) {
        this.maxSpeed = Math.max(client.uploadSpeed || 1, client.downloadSpeed || 1, this.maxSpeed);
      }
    },
    async listTop10 () {
      for (const id of Object.keys(this.expand)) {
        if (this.expand[id]) {
          (async () => {
            const res = await this.$axiosGet(`/api/client/listTop10?id=${id}&_=${Math.random()}`);
            this.torrents[id] = res ? res.data : [];
          })();
        }
      }
    },
    async expandClient (id) {
      this.expand[id] = this.expand[id] ? 0 : 1;
      if (!this.expand[id]) {
        this.torrents[id] = [];
      }
      this.listTop10();
      this.$forceUpdate();
    }
  },
  async mounted () {
    await this.listClient();
    this.freshData = setInterval(() => {
      this.listClient();
      this.listTop10();
    }, 5000);
  }
};
</script>

<style scoped>
</style>
