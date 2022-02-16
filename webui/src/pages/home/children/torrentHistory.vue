<template>
  <div class="torrent-history">
    <div class="torrent-history-div">
      <el-table
        :data="torrentList"
        :span-method="arraySpanMethod"
        :row-style="rowStyle"
        style="width: 100%;">
        <el-table-column
          align="center"
          label="名称">
          <el-table-column
            prop="c0"
            align="center"
            label="rss任务">
            <template slot-scope="scope">
              {{scope.row.c0 !== scope.row.name ? scope.row.c0 : ''}}
              <el-link v-if="scope.row.c0 === scope.row.name" type="primary" @click="gotoDetail(scope.row)">
                {{scope.row.c0}}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column
            align="center"
            prop="c1"
            label="大小">
          </el-table-column>
          <el-table-column
            align="center"
            prop="c2"
            label="上传/下载数据">
          </el-table-column>
          <el-table-column
            align="center"
            prop="c3"
            label="记录时间">
          </el-table-column>
          <el-table-column
            align="center"
            prop="c4"
            label="Tracker">
          </el-table-column>
          <el-table-column
            align="center"
            prop="c5"
            label="备注">
          </el-table-column>
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
      length: 100,
      paginationShow: true
    };
  },
  methods: {
    async listTorrentHistory () {
      const url = `/api/torrent/listHistory?page=${this.page}&length=${this.length}`;
      const res = await this.$axiosGet(url);
      this.total = 200;
      const _torrentList = [];
      for (const torrent of res.data.torrents) {
        _torrentList.push(torrent);
        _torrentList.push(torrent);
      }
      this.torrentList = _torrentList;
    },

    async changePage (page) {
      this.page = page;
      await this.listTorrentHistory();
    },

    async gotoDetail (row) {
      if (!row.link) return await this.$message.error('链接不存在');
      window.open(row.link);
    },

    arraySpanMethod ({ row, column, rowIndex, columnIndex }) {
      if (rowIndex % 2 === 0) {
        switch (columnIndex) {
        case 0:
          row.c0 = row.name;
          return [1, 6];
        case 1:
          return [0, 0];
        case 2:
          return [0, 0];
        case 3:
          return [0, 0];
        case 4:
          return [0, 0];
        case 5:
          return [0, 0];
        }
      } else {
        switch (columnIndex) {
        case 0:
          row.c0 = row.rssName;
          return [1, 1];
        case 1:
          row.c1 = `${this.$formatSize(row.size || 0)}`;
          return [1, 1];
        case 2:
          row.c2 = `${this.$formatSize(row.uploaded || 0)} / ${this.$formatSize(parseInt(row.downloaded) || 0)}`;
          return [1, 1];
        case 3:
          row.c3 = this.$moment(row.addTime * 1000).format('YYYY-MM-DD HH:mm:ss');
          return [1, 1];
        case 4:
          row.c4 = row.tracker;
          return [1, 1];
        case 5:
          row.c5 = row.type;
          return [1, 1];
        }
      }
    },
    rowStyle ({ row, rowIndex }) {
      if (rowIndex % 4 < 2) {
        return {
          background: '#B0E0E6'
        };
      } else if (rowIndex % 4 >= 2) {
        return {
          background: '#B4EEB4'
        };
      }
      return '';
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

.row1 {
  background: hsl(240, 66%, 83%);
}

.row2 {
  background: #C1FFC1;
}

</style>
