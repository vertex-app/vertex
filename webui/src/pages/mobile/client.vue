<template>
  <div class="mobile-client">
    <el-card v-for="item of clientList" :key="item.id" style="margin: 20px; position: relative;">
      <div style="height: 32px;">
        <div style="margin: 0; position: absolute; left: 0px; top: 0px; background: pink; border-radius: 8px 0 8px 0; padding: 4px; font-size: 10px;">
          <span> {{item.alias}} </span>
        </div>
        <div style="margin: 0; position: absolute; right: 0px; top: 0px; background: #7FFFAA; border-radius: 0 8px 0 8px; padding: 1px; font-size: 12px;">
          <div style="transform: scale(0.8);"> 自动删种 <div :style="`display: inline-block; width: 8px; height: 8px; border-radius: 4px; background: ${item.autoDelete ? 'green' : 'red'};`"></div></div>
        </div>
      </div>
      <div style="height: 32px; width: 100%;">
        <div style="margin: 0; font-size: 12px; position: absolute; left: 0px; top: 32px; width: 100%;">
          <div style="transform: scale(0.8); width: 100%; left: -8%; position: absolute; top: 0">
            <div :style="`transition: width 2s; z-index:-1; position: absolute; top: 0; left: -2.75%; background: #7FFFAA; height: 14px; width: ${Math.min(item.uploadSpeed / maxUploadSpeed * 1, 1) * 125}%`"></div>
            {{$formatSize(item.uploadSpeed)}}/s ↑
          </div>
          <div style="transform: scale(0.8); width: 100%; left: -8%; position: absolute; top: 14px;">
            <div :style="`transition: width 2s; z-index:-1; position: absolute; top: 0; left: -2.75%; background: red; height: 14px; width: ${Math.min(item.downloadSpeed / maxDownloadSpeed * 1, 1) * 125}%`"></div>
            {{$formatSize(item.downloadSpeed)}}/s ↓
          </div>
        </div>
        <div style="margin: 0; font-size: 12px; position: absolute; right: 0px; top: 32px;">
          <div style="transform: scale(0.8);"> {{$formatSize(item.allTimeUpload)}} ↑</div>
          <div style="transform: scale(0.8);"> {{$formatSize(item.allTimeDownload)}} ↓</div>
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
      maxUploadSpeed: 1,
      maxDownloadSpeed: 1,
    };
  },
  methods: {
    async listClient () {
      const res = await this.$axiosGet('/api/client/list?_=' + Math.random());
      this.clientList = res ? res.data : [];
      for (const client of this.clientList) {
        this.maxUploadSpeed = Math.max(client.uploadSpeed, this.maxUploadSpeed);
        this.maxDownloadSpeed = Math.max(client.downloadSpeed, this.maxDownloadSpeed);
      }
    }
  },
  mounted () {
    this.listClient();
    this.freshData = setInterval(() => {
      this.listClient();
    }, 3000);
  }
};
</script>

<style scoped>
</style>
