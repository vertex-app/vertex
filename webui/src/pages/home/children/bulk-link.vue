<template>
  <div>
    <div class="radius-div">
      <div style="margin: 20px auto; padding: 20px 0;">
        <el-form style="padding-left: 32px; color: #000; text-align: left;" label-width="160px" label-position="left" size="mini">
          <el-form-item label="分类">
            <el-select v-model="type" style="width: 200px" placeholder="分类">
              <el-option label="电影" value="movie"></el-option>
              <el-option label="剧集" value="series"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="keyword" type="input" style="width: 200px;" placeholder="客户端内分类或标签关键词"></el-input>
          </el-form-item>
          <el-form-item size="small">
            <el-button type="primary" @click="getBulkLinkList">检查</el-button>
            <el-button type="primary" @click="getBulkLinkList">识别</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div style="padding: 24px;">
        <el-table
          :data="fileList"
          fit
          size="mini">
          <el-table-column
            prop="name"
            sortable
            label="种子名称">
          </el-table-column>
          <el-table-column
            prop="scrapeName"
            width="216"
            label="识别名称">
            <template slot-scope="scope">
              <el-input v-model="scope.row.scrapeName" size="mini" placeholder="识别名称"/>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      linkRuleList: [],
      fileList: [],
      keyword: '',
      type: '',
      linkRule: ''
    };
  },
  methods: {
    async getBulkLinkList () {
      const res = await this.$axiosGet(`/api/torrent/getBulkLinkList?keyword=${this.keyword}`);
      this.fileList = res?.data;
    },
    async listLinkRule () {
      const res = await this.$axiosGet('/api/linkRule/list');
      this.linkRuleList = res ? res.data.sort((a, b) => a.alias > b.alias ? 1 : -1) : [];
    }
  },
  async mounted () {
    await this.listLinkRule();
  }
};
</script>

<style scoped>
.el-form-item {
  margin: 12px 0;
  margin-bottom: 0;
}
</style>
