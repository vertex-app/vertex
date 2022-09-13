<template>
  <div style="font-size: 24px; font-weight: bold;">种子聚合</div>
  <a-divider></a-divider>
  <div class="mix-torrent" >
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="qs"
        size="small"
        @finish="listTorrent"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="指定客户端"
          name="downloaders">
          <a-checkbox-group style="width: 100%;" v-model:value="qs.downloaders">
            <a-row>
              <a-col v-for="downloader of downloaders" :span="isMobile() ? 8 : 6" :key="downloader.id">
                <a-checkbox  v-model:value="downloader.id">{{ downloader.alias }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
          <div style="margin-top: 12px;">
            <a-button size="small" type="primary" @click="qs.downloaders = downloaders.map(item => item.id);">全部选中</a-button>
            <a-button size="small" type="primary" style="margin-left: 24px;" @click="qs.downloaders = [];">取消选中</a-button>
          </div>
        </a-form-item>
        <a-form-item
          label="搜索关键词"
          name="keword">
          <a-input size="small" v-model:value="qs.keyword" style="width: 240px"/>
          <a-button size="small" type="primary" style="margin-left: 24px;" html-type="submit">搜索</a-button>
        </a-form-item>
      </a-form>
    </div>
    <a-divider></a-divider>
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
        <span style="font-size: 16px; font-weight: bold;">种子聚合</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="['size', 'uploaded', 'downloaded'].indexOf(column.dataIndex) !== -1">
          {{ $formatSize(record[column.dataIndex]) }}
        </template>
        <template v-if="['recordTime', 'deleteTime', 'addedTime'].indexOf(column.dataIndex) !== -1 && record[column.dataIndex]">
          {{ $moment(record[column.dataIndex] * 1000).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-if="column.title === '操作'">
          <a @click="gotoDetail(record)">打开</a>
          <a-divider type="vertical" />
          <a @click="gotoDetail(record)">代理</a>
          <a-divider type="vertical" />
          <a @click="gotoLink(record)">软/硬链接</a>
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
        title: '客户端',
        dataIndex: 'clientAlias',
        width: 32,
        fixed: true
      }, {
        title: '种子名称',
        dataIndex: 'name',
        resizable: true,
        width: 144
      }, {
        title: '分类',
        dataIndex: 'category',
        width: 32
      }, {
        title: '标签',
        dataIndex: 'tags',
        width: 32
      }, {
        title: '种子大小',
        dataIndex: 'size',
        width: 32
      }, {
        title: '上传流量',
        dataIndex: 'uploaded',
        width: 32
      }, {
        title: '下载流量',
        dataIndex: 'downloaded',
        width: 32
      }, {
        title: '添加时间',
        dataIndex: 'addedTime',
        sorter: (a, b) => 0,
        width: 32
      }, {
        title: '操作',
        width: this.isMobile() ? 72 : 48
      }
    ];
    const qs = {
      page: 1,
      length: 20,
      downloaders: [],
      keyword: '',
      sortKey: '',
      sortType: ''
    };
    const pagination = {
      position: ['topRight', 'bottomRight'],
      total: 0,
      current: 1,
      pageSize: qs.length,
      showSizeChanger: false
    };
    return {
      loading: true,
      pagination,
      columns,
      qs,
      torrents: [],
      downloaders: []
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
    async listTorrent () {
      this.loading = true;
      try {
        const qs = {
          clientList: JSON.stringify(this.qs.downloaders),
          page: this.qs.page,
          length: this.qs.length,
          searchKey: this.qs.keyword,
          sortKey: this.qs.sortKey,
          sortType: this.qs.sortType
        };
        const res = (await this.$api().torrent.list(qs)).data;
        this.torrents = res.torrents;
        this.pagination.total = res.total;
      } catch (e) {
        await this.$message().error(e.message);
      }
      this.loading = false;
    },
    async listDownloader () {
      try {
        const res = await this.$api().downloader.list();
        this.downloaders = res.data;
        this.qs.downloaders = this.downloaders.map(item => item.id);
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async gotoDetail (record) {
      if (!record.link) return await this.$message().error('链接不存在');
      window.open(record.link);
    },
    async gotoLink (record) {
      window.open('/task/link?hash=' + record.hash);
    },
    async handleChange (pagination, filters, sorter) {
      if (sorter) {
        this.qs.sortKey = sorter.field;
        this.qs.sortType = sorter.order === 'ascend' ? 'asc' : 'desc';
      }
      this.pagination.current = pagination.current;
      this.qs.page = pagination.current;
      this.listTorrent();
    }
  },
  async mounted () {
    await this.listDownloader();
    this.listTorrent();
  }
};
</script>
<style scoped>
.mix-torrent {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
