<template>
  <div class="torrent-mix">
    <div class="torrent-mix-div">
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
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      torrentList: []
    };
  },
  methods: {
    async listTorrent () {
      const res = await this.$axiosGet('/api/torrent/list');
      this.torrentList = res ? res.data : [];
    }
  },
  async mounted () {
    this.listTorrent();
  }
};
</script>

<style scoped>
.torrent-mix-div {
  margin: 20px 0;
}
</style>
