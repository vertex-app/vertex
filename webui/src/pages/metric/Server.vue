<template>
  <div style="font-size: 24px; font-weight: bold;">服务器数据</div>
  <a-divider></a-divider>
  <div class="server-metric" >
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :loading="loading"
      :data-source="servers"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">服务器数据</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'netSpeed'">
          {{ $formatSize(record.netSpeed?.upload || 0) }}/s / {{ $formatSize(record.netSpeed?.download || 0) }}/s
        </template>
        <template v-if="column.dataIndex === 'cpuUse'">
          {{ (record.cpuUse || 0).toFixed(2) }}%
        </template>
      </template>
    </a-table>
  </div>
</template>
<script>
export default {
  data () {
    const columns = [
      {
        title: '服务器',
        dataIndex: 'alias',
        width: 6,
        fixed: true,
        sorter: (a, b) => a.name.localeCompare(b.name)
      }, {
        title: 'CPU 占用',
        dataIndex: 'cpuUse',
        sorter: (a, b) => a.cpuUse - b.cpuUse,
        width: 12
      }, {
        title: '实时上传/下载',
        dataIndex: 'netSpeed',
        sorter: (a, b) => a.netSpeed.upload - b.netSpeed.upload,
        width: 24
      }
    ];
    return {
      loading: true,
      columns,
      servers: [],
      netSpeed: {},
      cpuUse: {}
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
    async listServer () {
      this.loading = true;
      try {
        this.servers = (await this.$api().server.list()).data;
      } catch (e) {
        await this.$message().error(e.message);
      }
      this.loading = false;
    },
    async getNetSpeed () {
      try {
        this.netSpeed = (await this.$api().server.netSpeed()).data;
        for (const server of this.servers) {
          server.netSpeed = {
            upload: this.netSpeed[server.id]?.sort((a, b) => b.txBytes - a.txBytes)[0].txBytes || 0,
            download: this.netSpeed[server.id]?.sort((a, b) => b.txBytes - a.txBytes)[0].rxBytes || 0
          };
        }
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async getCpuUse () {
      try {
        this.cpuUse = (await this.$api().server.cpuUse()).data;
        for (const server of this.servers) {
          server.cpuUse = 100 - this.cpuUse[server.id]?.all.idle || 0;
        }
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    this.listServer();
    this.getNetSpeed();
    this.getCpuUse();
    setInterval(() => {
      this.getNetSpeed();
      this.getCpuUse();
    }, 5000);
  }
};
</script>
<style scoped>
.server-metric {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
