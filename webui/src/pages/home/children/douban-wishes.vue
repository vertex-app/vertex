<template>
  <div>
    <div class="radius-div">
      <div style="margin: 20px auto; padding: 20px auto; display: block;">
        <el-form class="filter-form" label-width="100px" size="mini">
          <el-form-item label="">
            <el-select style="width: 160px;" @change="listWishes"  v-model="downloaded" placeholder="完成状态">
              <el-option label="已完成" :value="true"></el-option>
              <el-option label="未完成" :value="false"></el-option>
            </el-select>
            <el-input style="width: 288px; padding-left: 20px;" v-model="key" type="input" placeholder="关键词" @change="listWishes"></el-input>
          </el-form-item>
        </el-form>
        <div style="margin: 20px auto;" >
          <el-card v-for="item of wishes" :key="item.id + item.doubanId" style="width: 240px; display:inline-block; margin: 20px;" class="radius-div">
            <img :src="item.poster" style="width: 200px; height: 280px;">
            <div style="margin: 12px auto;">
              <el-link style="font-size: 12px; color: #000; max-height: 50px;" @click="gotoDetail(item.link)">
                {{item.name.split('/')[0]}}
                <br>
                [{{item.tag}}] [{{item.year}}]
                <br>
                [{{(item.rating || '').result || '∞'}} / {{(item.rating || '').votes || '∞'}}] [{{item.episodeNow === 0 ? 0 : item.episodeNow || '1'}} / {{item.episodes === 0 ? 0 : item.episodes || '1'}}]
                </el-link>
            </div>
            <div style="margin: 12px auto;">
              <span style="margin-left: 10px; cursor: pointer; font-size: 10px; color: blue" @click="openEditDialog(item)"><fa style="font-size: 10px; color: green;" :icon="['fas', 'edit']"></fa> 编辑</span>
              <span style="margin-left: 10px; cursor: pointer; font-size: 10px; color: green" @click="refreshWish(item)" v-if="item.downloaded"><fa style="font-size: 10px; color: green;" :icon="['fas', 'check']"></fa> 已完成</span>
              <span style="margin-left: 10px; cursor: pointer; font-size: 10px; color: green" @click="refreshWish(item)" v-if="!item.downloaded"><fa style="font-size: 10px; color: green;" :icon="['fas', 'redo-alt']"></fa> 刷新</span>
              <span style="margin-left: 10px; cursor: pointer; font-size: 10px; color: red" @click="deleteWish(item)"><fa style="font-size: 10px; color: red;" :icon="['fas', 'times']"></fa> 删除</span>
            </div>
          </el-card>
        </div>
      </div>
      <div style="clear: both;"> </div>
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
        <el-form-item label="标签">
          <span>{{wish.tag}}</span>
        </el-form-item>
        <el-form-item required label="年份" prop="year">
          <el-input v-model="wish.year" type="input"></el-input>
        </el-form-item>
        <el-form-item label="总集数" prop="episodes">
          <el-input v-model="wish.episodes" type="number"  placeholder="电影务必留空"></el-input>
        </el-form-item>
        <el-form-item label="当前集" prop="episodeNow">
          <el-input v-model="wish.episodeNow" @change="() => { wish.downloaded = (+wish.episodes === +wish.episodeNow); }" type="number" placeholder="电影务必留空"></el-input>
        </el-form-item>
        <el-form-item required label="已完成" prop="downloaded">
          <el-checkbox v-model="wish.downloaded">已完成</el-checkbox>
        </el-form-item>
        <el-form-item label="刷新周期" prop="cron">
          <el-input v-model="wish.cron" type="input" placeholder="留空使用账号设置"></el-input>
        </el-form-item>
        <el-form-item label="包含关键词" prop="acceptKeys">
          <el-input v-model="wish.acceptKeys" type="input" placeholder="包含关键词"></el-input>
          <div><el-tag type="info">以 , 为分割, 各个关键词间为 且 的关系</el-tag></div>
        </el-form-item>
        <el-form-item label="排除关键词" prop="rejectKeys">
          <el-input v-model="wish.rejectKeys" type="input" placeholder="排除关键词"></el-input>
          <div><el-tag type="info">以 , 为分割, 各个关键词间为 或 的关系</el-tag></div>
        </el-form-item>
        <el-form-item label="禁止下载全集" prop="rejectKeys">
          <el-checkbox v-model="wish.rejectCompleteTorrent">禁止下载全集</el-checkbox>
          <div><el-tag type="info">如果当前集不为零, 且勾选禁止下载全集, 则在选择种子时排除全集种子</el-tag></div>
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
      length: 20,
      key: '',
      downloaded: '',
      paginationShow: true
    };
  },
  methods: {
    async listWishes () {
      let url = `/api/douban/listWishes?page=${this.page}&length=${this.length}`;
      if (this.downloaded !== '') {
        url += `&downloaded=${this.downloaded}`;
      }
      if (this.key) {
        url += `&key=${this.key}`;
      }
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
.filter-form {
  margin: 20px 0;
  padding-top: 20px;
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
