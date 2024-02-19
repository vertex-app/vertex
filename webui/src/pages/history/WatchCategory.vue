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
      <template #headerCell="{ column }">
        <template v-if="column.dataIndex === 'name'">
          <a-input style="margin-left: 14px; width: 140px;" size="small" placeholder="筛选种子名称" v-model:value="qs.name"></a-input>
          <a-button @click="() => { qs.page = 1; listHistory(); }" style="margin-left: 4px;" size="small">筛选</a-button>
        </template>
        <template v-if="column.dataIndex === 'task'">
          <a-input style="margin-left: 14px; width: 140px;" size="small" placeholder="筛选任务名称" v-model:value="qs.task"></a-input>
          <a-button @click="() => { qs.page = 1; listHistory(); }" style="margin-left: 4px;" size="small">筛选</a-button>
        </template>
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
        width: 16
      }, {
        title: '类型',
        dataIndex: 'type',
        width: 16
      }, {
        title: '种子大小',
        dataIndex: 'size',
        width: 24
      }, {
        title: '所属任务',
        dataIndex: 'task',
        width: 60
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
      task: '',
      name: ''
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
        if (this.qs.task) {
          this.history = this.history.filter(item => item.task.includes(this.qs.task));
        }
        if (this.qs.name) {
          this.history = this.history.filter(item => item.name.includes(this.qs.name));
        }
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
