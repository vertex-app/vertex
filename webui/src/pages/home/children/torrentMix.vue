<template>
  <div class="torrent-mix">
    <div class="torrent-mix-div">
      <el-form class="client-mix-form" label-width="100px" size="mini">
        <el-form-item label="选择客户端">
          <el-checkbox-group @change="listTorrent" v-model="clients">
            <el-checkbox v-for="client of clientList" :key="client.id" :label="client.id">{{client.clientAlias}}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="排序规则">
          <el-select @change="listTorrent"  v-model="sort.key" placeholder="排序字段">
            <el-option v-for="sortKey of sortKeys" :key="sortKey.key" :label="sortKey.value" :value="sortKey.key"></el-option>
          </el-select>
          <el-select @change="listTorrent"  v-model="sort.type" placeholder="升降序">
            <el-option v-for="sortType of sortTypes" :key="sortType.key" :label="sortType.value" :value="sortType.key"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <el-table
        :data="torrentList"
        :span-method="arraySpanMethod"
        :row-style="rowStyle"
        style="width: 100%;">
        <el-table-column
          align="center"
          label="客户端别名">
          <el-table-column
            prop="c0"
            align="center"
            label="状态">
          </el-table-column>
        </el-table-column>
        <el-table-column
          align="center"
          label="名称">
          <el-table-column
            align="center"
            prop="c1"
            label="上传/下载速度">
          </el-table-column>
          <el-table-column
            align="center"
            prop="c2"
            label="上传/下载数据">
          </el-table-column>
          <el-table-column
            align="center"
            prop="c3"
            label="大小">
          </el-table-column>
          <el-table-column
            align="center"
            prop="c4"
            label="Tracker">
          </el-table-column>
        </el-table-column>
        <el-table-column
          align="center"
          label="操作">
          <template slot-scope="scope">
            <el-button @click="queryDetail(scope.row)" type="primary" size="small">详情</el-button>
            <br>
            <el-button type="danger" size="small">删除</el-button>
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
      <el-dialog :title="torrentInfo.name" :visible.sync="torrentInfoVisible" width="80%">
        <el-descriptions title="">
          <el-descriptions-item label="开始时间">{{$moment(torrentInfo.addedTime * 1000).format('YYYY-MM-DD HH:mm:ss')}}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{torrentInfo.completedTime === -1 ? '∞' : $moment(torrentInfo.completedTime * 1000).format('YYYY-MM-DD HH:mm:ss')}}</el-descriptions-item>
          <el-descriptions-item label="当前进度">{{torrentInfo.progress * 100 + '%'}}</el-descriptions-item>
          <el-descriptions-item label="已上传">{{$formatSize(torrentInfo.uploaded)}}</el-descriptions-item>
          <el-descriptions-item label="已下载">{{$formatSize(torrentInfo.downloaded)}}</el-descriptions-item>
          <el-descriptions-item label="总大小">{{$formatSize(torrentInfo.size)}}</el-descriptions-item>
          <el-descriptions-item label="上传速度">{{$formatSize(torrentInfo.uploadSpeed)}}/s</el-descriptions-item>
          <el-descriptions-item label="下载速度">{{$formatSize(torrentInfo.downloadSpeed)}}/s</el-descriptions-item>
          <el-descriptions-item label="分享率">{{torrentInfo.ratio.toFixed(2)}}</el-descriptions-item>
      </el-descriptions>
      </el-dialog>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      clients: [],
      torrentList: [],
      torrentInfo: {
        ratio: 0
      },
      clientList: [],
      total: 0,
      totalPage: 0,
      page: 1,
      length: 20,
      sort: {
      },
      sortKeys: [
        {
          key: 'name',
          value: '名称'
        }, {
          key: 'uploadSpeed',
          value: '上传速度'
        }, {
          key: 'downloadSpeed',
          value: '下载速度'
        }, {
          key: 'uploaded',
          value: '已上传'
        }, {
          key: 'downloaded',
          value: '已下载'
        }, {
          key: 'tracker',
          value: 'Tracker'
        }
      ],
      sortTypes: [
        {
          key: 'asc',
          value: '升序'
        }, {
          key: 'desc',
          value: '降序'
        }
      ],
      stateMap: {
        downloading: '下载',
        stalledDL: '等待',
        Downloading: '下载',
        uploading: '上传',
        stalledUP: '做种',
        Seeding: '做种'
      },
      torrentInfoVisible: false,
      paginationShow: true
    };
  },
  methods: {
    async listTorrent () {
      let url = `/api/torrent/list?clientList=${encodeURIComponent(JSON.stringify(this.clients))}&page=${this.page}&length=${this.length}`;
      if (this.sort.key) {
        url += `&sortKey=${this.sort.key}`;
      }
      if (this.sort.type) {
        url += `&sortType=${this.sort.type}`;
      }
      const res = await this.$axiosGet(url);
      this.total = res ? res.data.total : 0;
      const torrentList = res ? res.data.torrents : [];
      this.torrentList = [];
      for (const torrent of torrentList) {
        this.torrentList.push(torrent);
        this.torrentList.push(torrent);
      }
    },
    async queryDetail (row) {
      this.torrentInfo = row;
      this.torrentInfoVisible = true;
    },

    async changePage (page) {
      this.torrents = [];
      const url = `/torrent-mix?clientList=${encodeURIComponent(JSON.stringify(this.clients))}&page=${page}&length=${this.length}`;
      this.$router.push(url);
      await this.listTorrent();
    },

    async listClient () {
      const res = await this.$axiosGet('/api/client/list');
      this.clientList = res ? res.data.filter(item => item.enable) : [];
    },

    arraySpanMethod ({ row, column, rowIndex, columnIndex }) {
      if (rowIndex % 2 === 0) {
        switch (columnIndex) {
        case 0:
          row.c0 = row.clientAlias;
          return [1, 1];
        case 1:
          row.c1 = row.name;
          return [1, 4];
        case 2:
          return [0, 0];
        case 3:
          return [0, 0];
        case 4:
          return [0, 0];
        case 5:
          return [2, 1];
        }
      } else {
        switch (columnIndex) {
        case 0:
          row.c0 = this.stateMap[row.state];
          return [1, 1];
        case 1:
          row.c1 = `${this.$formatSize(row.uploadSpeed)}/s / ${this.$formatSize(row.downloadSpeed)}/s`;
          return [1, 1];
        case 2:
          row.c2 = `${this.$formatSize(row.uploaded)} / ${this.$formatSize(row.downloaded)}`;
          return [1, 1];
        case 3:
          row.c3 = this.$formatSize(row.size);
          return [1, 1];
        case 4:
          row.c4 = row.tracker;
          return [1, 1];
        case 5:
          return [0, 0];
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
    this.listClient();
    this.listTorrent();
    this.freshTorrent = setInterval(() => {
      this.listTorrent();
    }, 5000);
  },
  beforeDestroy () {
    clearInterval(this.freshTorrent);
  }
};
</script>

<style scoped>
.torrent-mix-div {
  padding: 8px;
  border-radius: 8px;
  background: #FFF;
}

.client-mix-form {
  width: fit-content;
  text-align: left;
}

.row1 {
  background: hsl(240, 66%, 83%);
}

.row2 {
  background: #C1FFC1;
}

</style>
