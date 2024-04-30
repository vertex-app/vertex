<template>
  <div style="font-size: 24px; font-weight: bold;">下载器日志</div>
  <a-divider></a-divider>
  <div class="client-log">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="logs"
      :pagination="pagination"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">下载器日志</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'timestamp'">
          {{ $moment(record.timestamp > 1e11 ? record.timestamp : record.timestamp * 1e3).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-if="column.dataIndex === 'message'">
          <span :style="`${record.type === 4 ? 'color: red' : ''}`">{{ record.message }}</span>
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
        title: '时间',
        dataIndex: 'timestamp',
        width: 16,
        fixed: true
      }, {
        title: '信息',
        dataIndex: 'message',
        width: 96
      }
    ];
    const pagination = {
      position: ['topRight', 'bottomRight'],
      total: 0,
      pageSize: 100,
      showSizeChanger: false
    };
    return {
      pagination,
      columns,
      logs: []
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
    async getLog () {
      try {
        const res = await this.$api().downloader.getLogs(this.$route.query.id);
        this.logs = res.data.reverse();
        this.pagination.total = this.logs.length;
      } catch (e) {
        this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    if (!this.$route.query.id) {
      await this.$message().error('当前页面需要从下载器页面进入!');
      return;
    }
    await this.getLog();
  }
};
</script>
<style scoped>
.client-log {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
