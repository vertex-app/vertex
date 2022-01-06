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
        stripe
        style="width: 100%">
        <el-table-column
          prop="clientAlias"
          label="客户端别名"
          width="144">
        </el-table-column>
        <el-table-column
          prop="name"
          label="名称">
        </el-table-column>
        <el-table-column
          label="↑/↓">
          <template slot-scope="scope">
            ↑ {{`${$formatSize(scope.row.uploadSpeed)}/s`}}
            <br>
            ↓ {{`${$formatSize(scope.row.downloadSpeed)}/s`}}
          </template>
        </el-table-column>
        <el-table-column
          label="↑/↓">
          <template slot-scope="scope">
            ↑ {{`${$formatSize(scope.row.uploaded)}`}}
            <br>
            ↓ {{`${$formatSize(scope.row.downloaded)}`}}
          </template>
        </el-table-column>
        <el-table-column
          prop="state"
          label="状态">
        </el-table-column>
        <el-table-column
          label="大小">
          <template slot-scope="scope">
            {{$formatSize(scope.row.size)}}
          </template>
        </el-table-column>
        <el-table-column
          label="添加时间">
          <template slot-scope="scope">
            {{$moment(scope.row.addedTime * 1000).format('YYYY-MM-DD HH:mm:ss')}}
          </template>
        </el-table-column>
        <el-table-column
          label="完成时间">
          <template slot-scope="scope">
            {{$moment(scope.row.completedTime * 1000).format('YYYY-MM-DD HH:mm:ss')}}
          </template>
        </el-table-column>
        <el-table-column
          prop="tracker"
          label="Tracker">
        </el-table-column>
        <el-table-column
          label="操作"
          width="200">
          <template slot-scope="scope">
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
      paginationShow: false
    };
  },
  methods: {
    async listTorrent () {
      this.paginationShow = false;
      this.page = +this.$route.query.page || this.page;
      this.length = +this.$route.query.length || this.length;
      // this.clients = JSON.parse(+this.$route.query.clients || '[]');
      let url = `/api/torrent/list?clientList=${encodeURIComponent(JSON.stringify(this.clients))}&page=${this.page}&length=${this.length}`;
      if (this.sort.key) {
        url += `&sortKey=${this.sort.key}`;
      }
      if (this.sort.type) {
        url += `&sortType=${this.sort.type}`;
      }
      const res = await this.$axiosGet(url);
      this.total = res ? res.data.total : 0;
      this.torrentList = res ? res.data.torrents : [];
      this.$nextTick(() => {
        this.paginationShow = true;
      });
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
    }
  },
  async mounted () {
    this.listTorrent();
    this.listClient();
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
</style>
