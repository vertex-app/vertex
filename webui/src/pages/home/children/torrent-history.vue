<template>
  <div class="radius-div">
    <div class="torrent-history-div">
      <el-form class="torrent-history-form" inline label-width="100px" size="mini">
        <el-form-item label="选择 Rss">
          <el-select v-model="selectedRss" placeholder="Rss" @change="listTorrentHistory">
            <el-option v-for="rss of rssList" :key="rss.id" :label="rss.alias" :value="rss.id"></el-option>
            <el-option label="已删除" value="deleted"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="selectedType" placeholder="Rss" @change="listTorrentHistory">
            <el-option label="添加" :value="1"></el-option>
            <el-option label="拒绝" :value="2"></el-option>
            <el-option label="错误" :value="3"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchKey" placeholder="关键词" @keyup.enter.native="listTorrentHistory"/>
        </el-form-item>
        <el-form-item size="small">
          <el-button type="primary" @click="listTorrentHistory">查询</el-button>
          <el-button @click="() => { selectedRss = ''; searchKey = ''; selectedType = ''}">清空</el-button>
        </el-form-item>
      </el-form>
      <el-form class="torrent-history-form" inline label-width="100px" size="mini">
        <el-form-item label="展示内容">
          <el-checkbox-group v-model="setting.showKeys">
            <el-checkbox v-for="_key of keys" :key="_key.key" :label="_key.key">{{ _key.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item size="mini">
          <el-button type="primary" @click="modifyTorrentHistorySetting">保存</el-button>
        </el-form-item>
      </el-form>
      <el-table
        :data="torrentList"
        style="width: 100%; font-size: 14px;">
        <el-table-column type="expand" width="72">
          <template slot-scope="props">
            <el-form style="padding-left: 32px; width: 100%;" label-position="left" class="table-expand">
              <el-form-item label="种子名称">
                <span>{{ props.row.name }}</span>
              </el-form-item>
              <el-form-item label="种子大小">
                <span>{{ $formatSize(props.row.size || 0) }}</span>
              </el-form-item>
              <el-form-item label="记录时间">
                <span>{{ $moment(props.row.recordTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}</span>
              </el-form-item>
              <el-form-item label="添加时间">
                <span>{{props.row.addTime ? $moment(props.row.addTime * 1000).format('YYYY-MM-DD HH:mm:ss') : '∞' }}</span>
              </el-form-item>
              <el-form-item label="删除时间">
                <span>{{props.row.deleteTime ? $moment(props.row.deleteTime * 1000).format('YYYY-MM-DD HH:mm:ss') : '∞' }}</span>
              </el-form-item>
              <el-form-item label="上传流量">
                <span>{{ $formatSize(props.row.upload || 0) }}</span>
              </el-form-item>
              <el-form-item label="下载流量">
                <span>{{ $formatSize(props.row.download || 0) }}</span>
              </el-form-item>
              <el-form-item label="种子链接">
                <el-link type="primary" @click="gotoDetail(props.row)" style="line-height: 24px">{{ props.row.link }}</el-link>
              </el-form-item>
              <el-form-item label="记录备注">
                <br v-if="props.row.recordNote.indexOf('wish') !== -1"/>
                <span>{{ props.row.recordNote }}</span>
              </el-form-item>
            </el-form>
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('rss') !== -1"
          align="center"
          label="Rss"
          width="144">
          <template slot-scope="scope">
            {{rssList.filter(item => item.id === scope.row.rssId)[0] ? rssList.filter(item => item.id === scope.row.rssId)[0].alias : '已删除'}}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('name') !== -1"
          align="center"
          label="名称"
          min-width="244">
          <template slot-scope="scope">
            {{scope.row.name}}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('size') !== -1"
          align="center"
          label="种子大小"
          width="144">
          <template slot-scope="scope">
            {{$formatSize(scope.row.size || 0)}}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('recordTime') !== -1"
          align="center"
          label="记录时间"
          width="200">
          <template slot-scope="scope">
            {{$moment(scope.row.recordTime * 1000).format('YYYY-MM-DD HH:mm:ss')}}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('addTime') !== -1"
          align="center"
          label="添加时间"
          width="200">
          <template slot-scope="scope">
            {{scope.row.addTime ? $moment(scope.row.addTime * 1000).format('YYYY-MM-DD HH:mm:ss') : '∞' }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('deleteTime') !== -1"
          align="center"
          label="删除时间"
          width="200">
          <template slot-scope="scope">
            {{scope.row.deleteTime ? $moment(scope.row.deleteTime * 1000).format('YYYY-MM-DD HH:mm:ss') : '∞' }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('state') !== -1"
          align="center"
          label="种子状态"
          width="144">
          <template slot-scope="scope">
            {{ scope.row.recordNote.indexOf('wish') !== -1 ? '豆瓣' : scope.row.recordNote }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('link') !== -1"
          align="center"
          label="种子链接"
          width="144">
          <template slot-scope="scope">
            <el-link type="primary" @click="gotoDetail(scope.row)" style="line-height: 24px">种子链接</el-link>
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
      rssList: [],
      setting: {
        showKeys: []
      },
      keys: [{
        key: 'name',
        name: '种子名称'
      }, {
        key: 'rss',
        name: 'Rss 名称'
      }, {
        key: 'size',
        name: '种子大小'
      }, {
        key: 'state',
        name: '种子状态'
      }, {
        key: 'recordTime',
        name: '记录时间'
      }, {
        key: 'addTime',
        name: '添加时间'
      }, {
        key: 'deleteTime',
        name: '删除时间'
      }, {
        key: 'link',
        name: '种子链接'
      }],
      searchKey: '',
      selectedRss: '',
      selectedType: '',
      total: 0,
      totalPage: 0,
      page: 1,
      length: 20,
      paginationShow: true
    };
  },
  methods: {
    async listTorrentHistory () {
      const url = `/api/torrent/listHistory?page=${this.page}&length=${this.length}&rss=${encodeURIComponent(this.selectedRss)}&key=${encodeURIComponent(this.searchKey)}&type=${this.selectedType}`;
      const res = await this.$axiosGet(url);
      this.total = res.data.total;
      this.torrentList = res.data.torrents;
    },

    async listRss () {
      const url = '/api/rss/list';
      const res = await this.$axiosGet(url);
      this.rssList = res ? res.data.sort((a, b) => a.alias - b.alias) : [];
    },

    async changePage (page) {
      this.page = page;
      await this.listTorrentHistory();
    },

    async getTorrentHistorySetting () {
      const url = '/api/setting/getTorrentHistorySetting';
      const res = await this.$axiosGet(url);
      this.setting = { ...res.data, showKeys: res.data.showKeys || ['name', 'rss', 'size', 'state'] };
    },

    async modifyTorrentHistorySetting () {
      const url = '/api/setting/modifyTorrentHistorySetting';
      const res = await this.$axiosPost(url, this.setting);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
    },

    async gotoDetail (row) {
      if (!row.link) return await this.$message.error('链接不存在');
      window.open(row.link);
    }
  },
  async mounted () {
    this.listTorrentHistory();
    this.listRss();
    this.getTorrentHistorySetting();
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
