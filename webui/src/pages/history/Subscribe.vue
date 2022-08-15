<template>
  <div style="font-size: 24px; font-weight: bold;">订阅历史</div>
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
        <span style="font-size: 16px; font-weight: bold;">订阅历史</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'mediaName' && [6, 99].indexOf(record.recordType) !== -1">
          {{ JSON.parse(record.recordNote).wish.name }}
        </template>
        <template v-if="column.dataIndex === 'mediaName' && [6, 99].indexOf(record.recordType) === -1">
          种子推送
        </template>
        <template v-if="column.dataIndex === 'name'">
          <a @click="gotoDetail(record)">{{ record.name }}</a>
          <template v-if="[6, 99].indexOf(record.recordType) !== -1">
            <br>
            <span style="font-size: 12px;">{{ JSON.parse(record.recordNote).torrent.subtitle }}</span>
          </template>
          <a style="font-size: 12px;" @click="gotoDetail(record, true)">[代理打开]</a>
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
          <a @click="gotoLink(record)">软/硬链接</a>
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
        title: '剧集',
        dataIndex: 'mediaName',
        width: 24,
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
        title: '记录时间',
        dataIndex: 'recordTime',
        width: 32
      }, {
        title: '种子状态',
        dataIndex: 'recordNote',
        width: 16
      }, {
        title: '操作',
        dataIndex: 'option',
        width: 24
      }
    ];
    const qs = {
      page: 1,
      length: 20,
      type: 'bingewatching',
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
    async delRecord (record) {
      try {
        await this.$api().subscribe.delRecord({ id: record.id });
        this.listHistory();
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async gotoDetail (record, proxy) {
      if (!record.link) return await this.$message().error('链接不存在');
      window.open(proxy ? record.link.replace(/https:\/\/.*?\//, `/proxy/site/${record.rssId}/`) : record.link);
    },
    async handleChange (pagination, filters) {
      this.qs.page = pagination.current;
      this.listHistory();
    },
    async gotoLink (record) {
      window.open('/task/link?hash=' + record.hash);
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
