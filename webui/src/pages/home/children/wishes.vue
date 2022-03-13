<template>
  <div>
    <div class="radius-div">
      <el-table
        :data="wishesList"
        style="font-size: 14px; margin: 20px">
        <el-table-column
          >
          <template slot-scope="scope">
            <el-row>
              <el-col :span="8"  style="width: 220px; margin: 10px 0; line-height: 0">
                <el-card :body-style="{ padding: '10px' }" class="radius-div">
                  <img :src="scope.row.poster || scope.row.wish.poster" style="width: 200px">
                </el-card>
              </el-col>
              <el-col :span="16"  style="width: calc(100% - 220px); margin: 20px 0; padding-left: 20px;">
                <el-link style="font-size: 18px; color: #000;" @click="gotoDetail(scope.row.link || scope.row.wish.link)">{{scope.row.name || scope.row.wish.name}}</el-link>
                <span style="font-size: 13px">[推送时间: {{$moment(scope.row.recordTime).format('YYYY-MM-DD HH:mm:ss')}}]</span>
                <el-link style="font-size: 13px; color: red;" @click="deleteRecord(scope.row)">[删除记录]</el-link>
                <br>
                <el-link style="font-size: 15px; color: #000;" @click="gotoDetail((scope.row.torrent || {}).link)">{{(scope.row.torrent || {}).subtitle || ''}}[{{(scope.row.torrent || {}).site || ''}}]</el-link>
                <br>
                <span style="font-size: 13px">{{(scope.row.torrent || {}).title || ''}}[{{$formatSize((scope.row.torrent || {}).size || 0)}}]</span>
                <br>
                <span style="font-size: 13px">主创: {{(scope.row.wish || {}).mainCreator || ''}}</span>
                <br>
                <span v-if="scope.row.wish && scope.row.wish.rating" style="font-size: 13px">评分: {{scope.row.wish.rating.result || ''}} / {{scope.row.wish.rating.votes || ''}}</span>
                <br>
                <span font-size="13" style="font-size: 13px">分类: {{(scope.row.wish || {}).category || ''}}</span>
                <br>
                <span font-size="13" style="font-size: 13px">地区: {{(scope.row.wish || {}).area || ''}}</span>
                <br>
                <span font-size="13" style="font-size: 13px">简介: <br>{{(scope.row.wish || {}).desc || ''}}</span>
              </el-col>
            </el-row>
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
      wishesList: [],
      clientList: [],
      total: 0,
      totalPage: 0,
      page: 1,
      length: 20,
      paginationShow: true
    };
  },
  methods: {
    async listWishesHistory () {
      const url = `/api/douban/listHistory?page=${this.page}&length=${this.length}`;
      const res = await this.$axiosGet(url);
      this.total = res.data.total;
      this.wishesList = res.data.history;
    },

    async changePage (page) {
      this.page = page;
      await this.listWishesHistory();
    },

    async deleteRecord (row) {
      const url = `/api/douban/deleteRecord?id=${row.id}`;
      const res = await this.$axiosGet(url);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listWishesHistory();
    },

    async gotoDetail (link) {
      if (!link) return await this.$message.error('链接不存在');
      window.open(link);
    }
  },
  async mounted () {
    this.listWishesHistory();
  }
};
</script>

<style scoped>
.torrent-history-form {
  margin: 20px;
  padding-top: 24px;
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

</style>
