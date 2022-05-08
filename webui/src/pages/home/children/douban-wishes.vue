<template>
  <div>
    <div class="radius-div">
      <el-table
        :data="wishes"
        style="font-size: 14px; margin: 20px">
        <el-table-column
          >
          <template slot-scope="scope">
            <el-row>
              <el-col :span="8"  style="width: 220px; margin: 10px 0; line-height: 0">
                <el-card :body-style="{ padding: '10px' }" class="radius-div">
                  <img :src="scope.row.poster" style="width: 200px">
                </el-card>
              </el-col>
              <el-col :span="16"  style="width: calc(100% - 220px); margin: 20px 0; padding-left: 20px;">
                <el-link style="font-size: 18px; color: #000;" @click="gotoDetail(scope.row.link)">{{scope.row.name}} [{{scope.row.tag}}] [{{scope.row.year}}]</el-link>
                <span style="margin-left: 10px; cursor: pointer; color: blue" @click="openEditDialog(scope.row)"><fa style="font-size: 12px; color: green;" :icon="['fas', 'edit']"></fa> 编辑</span>
                <span style="margin-left: 10px; cursor: pointer; color: green" @click="refreshWish(scope.row)" v-if="!scope.row.downloaded"><fa style="font-size: 12px; color: green;" :icon="['fas', 'redo-alt']"></fa> 刷新</span>
                <span style="margin-left: 10px; cursor: pointer; color: red" @click="deleteWish(scope.row)"><fa style="font-size: 12px; color: red;" :icon="['fas', 'times']"></fa> 删除</span>
                <br>
                <span style="font-size: 13px">进度: </span><span :style="'font-size: 13px; color: ' + (scope.row.downloaded ? 'green' : 'blue')">{{(scope.row.episodes ? `${scope.row.episodeNow}/${scope.row.episodes}` : '') + (scope.row.downloaded ? '已完成' : '未完成')}}</span>
                <br>
                <span style="font-size: 13px">主创: {{(scope.row || {}).mainCreator || ''}}</span>
                <br>
                <span v-if="scope.row.rating" style="font-size: 13px">评分: {{scope.row.rating.result || ''}} / {{scope.row.rating.votes || ''}}</span>
                <br>
                <span font-size="13" style="font-size: 13px">分类: {{scope.row.category || ''}}</span>
                <br>
                <span font-size="13" style="font-size: 13px">地区: {{scope.row.area || ''}}</span>
                <br>
                <span font-size="13" style="font-size: 13px">简介: <br>{{scope.row.desc || ''}}</span>
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
    <el-dialog :title="`修改 ${this.wish.name}`" :visible.sync="editWishVisible">
      <el-form ref="wish" :model="wish" label-width="144px" size="mini" style="width: 720px; text-align: left;">
        <el-form-item required label="影视剧名" prop="name">
          <el-input v-model="wish.name" type="input"></el-input>
        </el-form-item>
        <el-form-item required label="年份" prop="year">
          <el-input v-model="wish.year" type="input"></el-input>
        </el-form-item>
        <el-form-item v-if="wish.episodes !== undefined" required label="总集数" prop="episodes">
          <el-input v-model="wish.episodes" type="number"></el-input>
        </el-form-item>
        <el-form-item v-if="wish.episodeNow !== undefined" required label="当前集" prop="episodeNow">
          <el-input v-model="wish.episodeNow" @change="() => { wish.downloaded = (+wish.episodes === +wish.episodeNow); }" type="number"></el-input>
        </el-form-item>
        <el-form-item required label="已完成" prop="downloaded">
          <el-checkbox v-model="wish.downloaded">已完成</el-checkbox>
        </el-form-item>
        <el-form-item label="刷新周期" prop="cron">
          <el-input v-model="wish.cron" type="input" placeholder="留空使用账号设置"></el-input>
        </el-form-item>
        <el-form-item label="排除关键词" prop="rejectKeys">
          <el-input v-model="wish.rejectKeys" type="input" placeholder="暂不生效"></el-input>
        </el-form-item>
        <el-form-item size="mini">
          <el-button @click="editWish" type="primary">编辑</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data () {
    return {
      wish: {},
      wishes: [],
      editWishVisible: false,
      relinkVisible: false,
      relinkRow: {},
      total: 0,
      totalPage: 0,
      page: 1,
      length: 5,
      paginationShow: true
    };
  },
  methods: {
    async listWishes () {
      const url = `/api/douban/listWishes?page=${this.page}&length=${this.length}`;
      const res = await this.$axiosGet(url);
      this.total = res.data.total;
      this.wishes = res.data.wishes;
    },

    async changePage (page) {
      this.page = page;
      await this.listWishes();
    },

    async gotoDetail (link) {
      if (!link) return await this.$message.error('链接不存在');
      window.open(link);
    },

    openEditDialog (row) {
      this.wish = { ...row };
      this.editWishVisible = true;
    },

    async deleteWish (item) {
      const url = `/api/douban/deleteWish?douban=${item.doubanId}&id=${item.id}`;
      const res = await this.$axiosGet(url);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listWishes();
    },

    async editWish () {
      const url = '/api/douban/editWish';
      const res = await this.$axiosPost(url, this.wish);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.editWishVisible = false;
      this.listWishes();
    },

    async refreshWish (item) {
      const url = `/api/douban/refreshWish?douban=${item.doubanId}&id=${item.id}`;
      const res = await this.$axiosGet(url);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listWishes();
    }
  },
  async mounted () {
    this.listWishes();
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
