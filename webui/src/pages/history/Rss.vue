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
      }
    ];
    const qs = {
      page: 1,
      length: 20
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
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async handleChange (pagination) {
      this.qs.page = pagination.current;
      this.listHistory();
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
