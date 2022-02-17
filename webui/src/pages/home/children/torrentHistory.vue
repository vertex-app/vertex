<template>
  <div class="torrent-history">
    <div class="torrent-history-div">
       <el-form class="torrent-history-form" label-width="100px" size="mini">
        <el-form-item label="选择 Rss">
          <el-select v-model="selectedRss" placeholder="Rss">
            <el-option v-for="rss of rssList" :key="rss.name" :label="rss.name" :value="rss.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchKey" placeholder="关键词"/>
        </el-form-item>
        <el-form-item size="small">
          <el-button type="primary" @click="listTorrentHistory">查询</el-button>
          <el-button @click="() => { selectedRss = ''; searchKey = ''}">清空</el-button>
        </el-form-item>
      </el-form>
      <el-table
        :data="torrentList"
        size="small"
        stripe
        style="width: 100%; font-size: 14px;">
        <el-table-column type="expand">
          <template slot-scope="props">
            <el-form style="padding-left: 32px; width: 100%;" label-position="left" class="table-expand">
              <el-form-item label="种子名称">
                <span>{{ props.row.name }}</span>
              </el-form-item>
              <el-form-item label="种子大小">
                <span>{{ $formatSize(props.row.size || 0) }}</span>
              </el-form-item>
              <el-form-item label="添加时间">
                <span>{{ $moment(props.row.addTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}</span>
              </el-form-item>
              <el-form-item label="上传流量">
                <span>{{ $formatSize(props.row.uploaded || 0) }}</span>
              </el-form-item>
              <el-form-item label="下载流量">
                <span>{{ $formatSize(props.row.downloaded || 0) }}</span>
              </el-form-item>
              <el-form-item label="种子链接">
                <el-link type="primary" @click="gotoDetail(props.row)" style="line-height: 24px">{{ props.row.link }}</el-link>
              </el-form-item>
              <el-form-item label="种子状态">
                <span>{{ props.row.type }}</span>
              </el-form-item>
            </el-form>
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          label="Rss"
          width="144">
          <template slot-scope="scope">
            {{scope.row.rssName}}
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          label="名称">
          <template slot-scope="scope">
            {{scope.row.name}}
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          label="种子大小"
          width="144">
          <template slot-scope="scope">
            {{$formatSize(scope.row.size || 0)}}
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          label="种子状态"
          width="144"
          fixed="right">
          <template slot-scope="scope">
            {{ scope.row.type }}
          </template>
        </el-table-column>
      </el-table>
      <div style="margin: 0 auto; width: fit-content">
        <el-pagination
          style="padding: 24px 0 12px 0"
          v-if="paginationShow"
          @current-change="changePage"
          :small="true"
          background
          :page-size="length"
          :pager-count="11"
          layout="prev, pager, next"
          :current-page="page"
          :total="total">
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      clients: [],
      torrentList: [],
      clientList: [],
      rssList: [],
      searchKey: '',
      selectedRss: '',
      total: 0,
      totalPage: 0,
      page: 1,
      length: 20,
      paginationShow: true
    };
  },
  methods: {
    async listTorrentHistory () {
      const url = `/api/torrent/listHistory?page=${this.page}&length=${this.length}&rss=${encodeURIComponent(this.selectedRss)}&key=${encodeURIComponent(this.searchKey)}`;
      const res = await this.$axiosGet(url);
      this.total = res.data.total;
      this.torrentList = res.data.torrents;
    },

    async listRss () {
      const url = '/api/torrent/listRss';
      const res = await this.$axiosGet(url);
      this.rssList = res.data;
    },
    async changePage (page) {
      this.page = page;
      await this.listTorrentHistory();
    },

    async gotoDetail (row) {
      if (!row.link) return await this.$message.error('链接不存在');
      window.open(row.link);
    }
  },
  async mounted () {
    this.listTorrentHistory();
    this.listRss();
  }
};
</script>

<style scoped>
.torrent-history-div {
  padding: 8px;
  border-radius: 8px;
  background: #FFF;
}

.torrent-history-form {
  width: fit-content;
  text-align: left;
}

.table-expand .el-form-item {
  margin-bottom: 0;
}

.table-expand {
  width: fit-content;
  text-align: left;
}

.table-expand label {
  width: 90px;
  color: #99a9bf;
}

.el-table__expand-column .cell {
  width: 48px;
  height: 48px;
  padding-left: 0;
  padding-right: 0;
}
</style>
