<template>
  <div>
    <div class="radius-div">
      <div style="margin: 20px auto; padding: 20px 0;">
        <el-form style="padding-left: 32px; color: #000; text-align: left;" label-width="160px" label-position="left" size="mini">
          <el-form-item label="分类">
            <el-select v-model="type" style="width: 200px" placeholder="分类" clearable>
              <el-option label="电影" value="movie"></el-option>
              <el-option label="剧集" value="series"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="keyword" type="input" style="width: 200px;" placeholder="客户端内分类或标签关键词"></el-input>
          </el-form-item>
          <el-form-item size="small">
            <el-button type="primary" @click="getBulkLinkList">检查</el-button>
            <el-button type="primary" @click="doScrape">识别</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div style="padding: 24px; font-size: 14px; text-align: left;" v-if="torrentList[0]">
        <el-select
          filterable
          size="mini"
          style="width: calc(100% - 144px);"
          v-model="selectTorrent"
          placeholder="新增">
          <el-option
            v-for="item in torrentList"
            :key="item.hash"
            :disabled="item.visible"
            :label="item.name"
            :value="item.hash">
          </el-option>
        </el-select>
        <el-button size="mini" type="primary" @click="() => { torrentList.filter(item => item.hash === selectTorrent)[0].visible = true; selectTorrent = '' }">新增</el-button>
      </div>
      <div style="padding: 24px;">
        <el-table
          :data="torrentList.filter(item => item.visible)"
          fit
          size="mini">
          <el-table-column
            prop="name"
            sortable
            v-if="torrentList[0].hash"
            label="种子名称">
          </el-table-column>
          <el-table-column
            prop="scrapedName"
            width="216"
            v-if="torrentList[0].hash"
            label="识别名称">
            <template slot-scope="scope">
              <el-input v-model="scope.row.scrapedName" size="mini" placeholder="识别名称"/>
            </template>
          </el-table-column>
          <el-table-column
            width="114"
            v-if="torrentList[0].hash"
            label="操作">
            <template slot-scope="scope">
              <fa :icon="['fas', 'times']" @click="() => { scope.row.visible = false }" style="width: 20px; color: red; cursor: pointer;"></fa>
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
      torrentList: [{}],
      selectTorrent: '',
      keyword: '',
      type: '',
      linkRule: ''
    };
  },
  methods: {
    async getBulkLinkList () {
      const res = await this.$axiosGet(`/api/torrent/getBulkLinkList?keyword=${this.keyword}`);
      this.torrentList = res?.data.map(item => { return { ...item, visible: true, scrapedName: '' }; });
    },
    async scrapeName (row) {
      const res = await this.$axiosGet(`/api/torrent/scrapeName?name=${encodeURIComponent(row.name)}&type=${this.type}`);
      this.torrentList.filter(item => item.hash === row.hash)[0].scrapedName = res?.data;
    },
    async doScrape () {
      for (const torrent of this.torrentList) {
        if (!torrent.visible) continue;
        await this.scrapeName(torrent);
      }
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
