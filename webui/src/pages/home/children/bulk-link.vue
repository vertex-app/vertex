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
            <el-input v-model="keyword" type="input" style="width: 200px;" placeholder="分类或标签关键词"></el-input>
          </el-form-item>
          <el-form-item size="small">
            <el-button type="primary" @click="startLink">执行</el-button>
            <el-button type="primary" @click="dryrun">测试</el-button>
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
    async getTorrentInfo () {
      const res = await this.$axiosGet(`/api/torrent/scrapeName?keyword=${this.keyword}&type=${this.type}`);
      this.torrentInfo = res?.data;
      if (this.torrentInfo.scrapeName) {
        this.mediaName = this.torrentInfo.scrapeName;
      }
    },
    async listLinkRule () {
      const res = await this.$axiosGet('/api/linkRule/list');
      this.linkRuleList = res ? res.data.sort((a, b) => a.alias > b.alias ? 1 : -1) : [];
    },
    async startLink () {
      const res = await this.$axiosPost('/api/torrent/link', {
        hash: this.hash,
        type: this.type,
        mediaName: this.mediaName,
        linkRule: this.linkRule,
        client: this.torrentInfo.client,
        libraryPath: this.libraryPath,
        savePath: this.torrentInfo.savePath
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
    },
    async dryrun () {
      const res = await this.$axiosGet(`/api/torrent/scrapeName?keyword=${this.keyword}&type=${this.type}`);
      this.fileList = res?.data;
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
