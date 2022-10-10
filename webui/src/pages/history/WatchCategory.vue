<template>
  <div style="font-size: 24px; font-weight: bold;">监控分类任务历史</div>
  <a-divider></a-divider>
  <div class="rss" >
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :loading="loading"
      :data-source="history"
      :pagination="pagination"
      :scroll="{ x: 960 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">监控分类任务历史</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'size'">
          {{ $formatSize(record.size) }}
        </template>
        <template v-if="column.title === '操作'">
          <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
            <template #content>
              <a-button type="primary" danger @click="delRecord(record)" size="small">删除</a-button>
            </template>
            <a style="color: red">删除</a>
          </a-popover>
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
        title: '识别名称',
        dataIndex: 'scrapedName',
        width: 24,
        fixed: true
      }, {
        title: '种子名称',
        dataIndex: 'name',
        width: 120
      }, {
        title: '年份',
        dataIndex: 'year',
        width: 24
      }, {
        title: '类型',
        dataIndex: 'type',
        width: 24
      }, {
        title: '种子大小',
        dataIndex: 'size',
        width: 24
      }, {
        title: '所属任务',
        dataIndex: 'task',
        width: 24
      }, {
        title: '操作',
        dataIndex: 'option',
        width: 16
      }
    ];
    const qs = {
      page: 1,
      length: 20,
      type: 'rss',
      rss: ''
    };
    const pagination = {
      position: ['topRight', 'bottomRight'],
      total: 0,
      pageSize: qs.length,
      showSizeChanger: false
    };
    return {
      loading: true,
      pagination,
      columns,
      qs,
      history: []
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
    async listHistory () {
      this.loading = true;
      try {
        const res = (await this.$api().watch.listHistory(this.qs)).data;
        this.history = res;
        this.pagination.total = res.length;
      } catch (e) {
        await this.$message().error(e.message);
      }
      this.loading = false;
    },
    async delRecord (record) {
      try {
        const res = await this.$api().watch.delRecord({ hash: record.hash, taskId: record.taskId });
        this.$message().success(res.message);
        this.listHistory();
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    this.listHistory();
  }
};
</script>
<style scoped>
.rss {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
