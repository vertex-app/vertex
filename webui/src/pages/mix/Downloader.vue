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
      :scroll="{ x: 1440 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">种子聚合</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="['size', 'uploaded', 'downloaded'].indexOf(column.dataIndex) !== -1">
          {{ $formatSize(record[column.dataIndex]) }}
        </template>
        <template v-if="column.dataIndex === 'ratio'">
          {{ record.ratio.toFixed(3) }}
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
          <a-divider type="vertical" />
          <a style="color: red;" @click="expandDel(record)">删除</a>
        </template>
      </template>
    </a-table>
  </div>
  <a-modal
    v-model:visible="modalVisible"
    title="删除种子"
    width="1440px"
    :footer="null">
    <div style="text-align: left; ">
      <a-alert message="注意事项" type="info" >
        <template #description>
          执行删除操作后, 会通过列出的服务器删除对应的链接文件, 并且删除下载器内的种子以及该种子的文件, 请谨慎操作。
          目前仅支持 qBittorrent
          <br>
          <br>
          种子标题: {{ delInfo.title }}
        </template>
      </a-alert>
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="delInfo"
        size="small"
        @finish="deleteTorrent"
        :labelCol="{ span: 6 }"
        :wrapperCol="{ span: 18 }"
        autocomplete="off">
        <a-form-item
          :wrapperCol="{ span:24 }">
          <a-table
            :style="`font-size: ${isMobile() ? '12px': '14px'};`"
            :columns="delFilesColumns"
            size="small"
            :data-source="delInfo.files"
            :pagination="false"
            :scroll="{ x: 960 }"
          >
            <template #title>
              <span style="font-size: 16px; font-weight: bold;">文件列表</span>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'server'">
                {{ record.server === '$local$' ? '本地' : (servers.filter(item => item.id === record.server)[0] || {}).alias || '已删除' }}
              </template>
            </template>
          </a-table>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 18, offset: 6 }">
          <a-button size="small" @click="() => modalVisible = false">取消</a-button>
          <a-button size="small" type="primary" danger style="margin-left: 24px;" html-type="submit">删除</a-button>
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>
<script>
export default {
  data () {
    const columns = [
      {
        title: '客户端',
        dataIndex: 'clientAlias',
        sorter: (a, b) => 0,
        width: 32,
        fixed: true
      }, {
        title: '种子名称',
        dataIndex: 'name',
        sorter: (a, b) => 0,
        defaultSortOrder: 'ascend',
        resizable: true,
        width: 144
      }, {
        title: '分类',
        dataIndex: 'category',
        sorter: (a, b) => 0,
        width: 42
      }, {
        title: '标签',
        dataIndex: 'tags',
        sorter: (a, b) => 0,
        width: 32
      }, {
        title: '种子大小',
        dataIndex: 'size',
        sorter: (a, b) => 0,
        width: 32
      }, {
        title: '上传流量',
        dataIndex: 'uploaded',
        sorter: (a, b) => 0,
        width: 32
      }, {
        title: '下载流量',
        dataIndex: 'downloaded',
        sorter: (a, b) => 0,
        width: 32
      }, {
        title: '分享率',
        dataIndex: 'ratio',
        sorter: (a, b) => 0,
        width: 28
      }, {
        title: '添加时间',
        dataIndex: 'addedTime',
        sorter: (a, b) => 0,
        width: 36
      }, {
        title: '操作',
        width: this.isMobile() ? 96 : 72
      }
    ];
    const delFilesColumns = [
      {
        title: '服务器',
        dataIndex: 'server',
        width: 4
      }, {
        title: '文件路径',
        dataIndex: 'filepath',
        width: 32
      }
    ];
    const qs = {
      page: 1,
      length: 20,
      downloaders: [],
      keyword: '',
      sortKey: 'addedTime',
      sortType: 'desc'
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
      modalVisible: false,
      columns,
      servers: [],
      delFilesColumns,
      delInfo: {
        files: []
      },
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
    async listServer () {
      try {
        const res = await this.$api().server.list();
        this.servers = res.data;
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
    async expandDel (record) {
      this.modalVisible = true;
      try {
        this.delInfo.files = (await this.$api().torrent.getDelInfo({ hash: record.hash })).data.map(item => ({
          server: item.split('####')[0],
          filepath: item.split('####')[1]
        }));
        this.delInfo.hash = record.hash;
        this.delInfo.title = record.name;
        this.delInfo.clientId = record.client;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async deleteTorrent () {
      this.modalVisible = true;
      try {
        const r = await this.$api().torrent.deleteTorrent(this.delInfo);
        this.$message().success(r.message);
      } catch (e) {
        this.$message().error(e.message);
      }
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
    this.listServer();
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
