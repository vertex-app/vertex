<template>
  <div class="torrent-history">
    <div class="torrent-history-div">
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
                <el-link type="primary" :href="props.row.link">{{ props.row.link }}</el-link>
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
      total: 0,
      totalPage: 0,
      page: 1,
      length: 20,
      paginationShow: true
    };
  },
  methods: {
    async listTorrentHistory () {
      const url = `/api/torrent/listHistory?page=${this.page}&length=${this.length}`;
      const res = await this.$axiosGet(url);
      this.total = res.data.total;
      this.torrentList = res.data.torrents;
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
  }
};
</script>

<style scoped>
.torrent-history-div {
  padding: 8px;
  border-radius: 8px;
  background: #FFF;
}

.table-expand {
  width: fit-content;
  text-align: left;
}

.table-expand label {
  width: 90px;
  color: #99a9bf;
}
</style>
