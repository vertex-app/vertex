<template>
  <div style="font-size: 24px; font-weight: bold;">RSS 历史</div>
  <a-divider></a-divider>
  <div class="rss" >
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :loading="loading"
      :data-source="torrents"
      :pagination="pagination"
      @change="handleChange"
      :scroll="{ x: 960 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">RSS 历史</span>
        <span style="font-size: 14px; font-weight: bold; color: red; margin-left: 12px;">遇到问题先去看 Wiki，特别是 Wiki 里的常见问题, 实在找不到再去交流群问, 别 TM Wiki 不看直接在群里问。</span>
      </template>
      <template #headerCell="{ column }">
        <template v-if="column.dataIndex === 'name'">
          种子名称
          <a-input style="margin-left: 14px; width: 140px;" size="small" placeholder="筛选关键词" v-model:value="qs.key"></a-input>
          <a-button @click="() => { qs.page = 1; listHistory(); }" style="margin-left: 4px;" size="small">筛选</a-button>
        </template>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'rssId'">
          {{ (rssList.filter(item => item.id === record.rssId)[0] || { alias: '已删除' }).alias }}
        </template>
        <template v-if="['size', 'upload', 'download'].indexOf(column.dataIndex) !== -1">
          {{ $formatSize(record[column.dataIndex]) }}
        </template>
        <template v-if="['recordTime', 'deleteTime'].indexOf(column.dataIndex) !== -1 && record[column.dataIndex]">
          {{ $moment(record[column.dataIndex] * 1000).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-if="column.dataIndex === 'recordNote'">
          <span>{{ record.recordNote.indexOf('wish') !== -1 ? '豆瓣' : record.recordNote }}</span>
        </template>
        <template v-if="column.title === '操作'">
          <a @click="gotoDetail(record)">打开</a>
          <a-divider type="vertical" />
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
        title: 'RSS',
        dataIndex: 'rssId',
        width: 18,
        filterMultiple: false,
        fixed: true
      }, {
        title: '种子名称',
        dataIndex: 'name',
        width: 120
      }, {
        title: '种子大小',
        dataIndex: 'size',
        width: 24
      }, {
        title: '上传流量',
        dataIndex: 'upload',
        width: 24
      }, {
        title: '下载流量',
        dataIndex: 'download',
        width: 24
      }, {
        title: '记录时间',
        dataIndex: 'recordTime',
        width: 32
      }, {
        title: '删除时间',
        dataIndex: 'deleteTime',
        width: 32
      }, {
        title: '种子状态',
        dataIndex: 'recordNote',
        width: 32
      }, {
        title: '操作',
        dataIndex: 'option',
        width: 32
      }
    ];
    const qs = {
      page: 1,
      length: 20,
      type: 'rss',
      rss: '',
      key: ''
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
      torrents: [],
      rssList: []
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
        const res = (await this.$api().torrent.listHistory(this.qs)).data;
        this.torrents = res.torrents;
        this.pagination.total = res.total;
      } catch (e) {
        await this.$message().error(e.message);
      }
      this.loading = false;
    },
    async listRss () {
      try {
        const res = await this.$api().rss.list();
        this.rssList = res.data;
        this.columns[0].filters = [...this.rssList.map(item => ({ text: item.alias, value: item.id })), { text: '已删除', value: 'deleted' }];
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async gotoDetail (record) {
      if (!record.link) return await this.$message().error('链接不存在');
      window.open(record.link);
    },
    async handleChange (pagination, filters) {
      this.qs.page = pagination.current;
      if (filters.rssId) {
        this.qs.rss = filters.rssId[0];
      } else {
        this.qs.rss = '';
      }
      this.listHistory();
    },
    async delRecord (record) {
      try {
        await this.$api().rss.delRecord({ id: record.id });
        this.$message().success('删除成功, 列表刷新中....');
        this.listHistory();
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    this.listHistory();
    this.listRss();
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
