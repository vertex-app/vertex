<template>
  <div class="radius-div">
    <div class="wishes-div">
      <el-table
        :data="wishesList"
        style="width: 100%; font-size: 14px;">
        <el-table-column
          >
          <template slot-scope="scope">
            <el-row>
              <el-col :span="8"  style="width: 220px; margin: 10px 0;">
                <el-card :body-style="{ padding: '10px' }" class="radius-div">
                  <img :src="scope.row.poster || scope.row.wish.poster" style="width: 200px">
                  <div style="padding-top: 14px;">
                    <el-link @click="gotoDetail(scope.row.link || scope.row.wish.link)">{{scope.row.name || scope.row.wish.name}}</el-link>
                    <br>
                    <el-link @click="gotoDetail((scope.row.torrent || {}).link)" style="">种子链接</el-link>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="16"  style="margin: 10px 0; padding-left: 20px;" class="radius-div">
                <span font-size="18" style="">{{(scope.row.torrent || {}).subtitle || ''}}</span>
                <br>
                <span font-size="13" style="">{{(scope.row.torrent || {}).title || ''}}</span>
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
