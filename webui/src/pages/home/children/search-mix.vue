<template>
  <div>
    <div class="radius-div" >
      <el-form class="search-mix-form" style="margin: 20px 0" label-width="100px" size="mini">
        <el-form-item label="选择站点">
          <el-checkbox :indeterminate="isIndeterminateSites" v-model="checkAllSites" @change="handleCheckAllSitesChange">全选</el-checkbox>
          <el-checkbox-group v-model="searchSiteList">
            <el-checkbox v-for="item of siteList" :key="item.name" :label="item.name">{{`${item.name === 'SpringSunDay' ? '不可说' : item.name}`}}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <el-form class="search-mix-form" inline label-width="100px" size="mini" @submit.native.prevent>
        <el-form-item label="关键词">
          <el-input v-model="searchKey" placeholder="关键词" @keyup.enter.native="searchTorrent"/>
        </el-form-item>
        <el-form-item size="mini">
          <el-button type="primary" @click="searchTorrent">{{ this.searchStatus }}</el-button>
        </el-form-item>
        <el-form-item label="筛选关键词">
          <el-input v-model="filterKey" placeholder="筛选关键词" @keyup.enter.native="filteTorrent"/>
        </el-form-item>
        <el-form-item size="mini">
          <el-button type="primary" @click="filteTorrent">筛选关键词</el-button>
        </el-form-item>
      </el-form>
      <el-form class="search-mix-form" label-width="100px" size="small">
        <el-form-item label="搜索结果">
          <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">全选</el-checkbox>
          <el-checkbox-group v-model="checkList" @change="refreshList">
            <el-checkbox v-for="item of resultCount" :key="item.site" :label="item.site">{{`${item.site === 'SpringSunDay' ? '不可说' : item.site}: ${item.count}`}}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <!--
      <el-form class="search-mix-form" inline label-width="100px" size="mini">
        <el-form-item label="展示内容">
          <el-checkbox-group v-model="setting.showKeys">
            <el-checkbox v-for="_key of keys" :key="_key.key" :label="_key.key">{{ _key.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item size="mini">
          <el-button type="primary" @click="modifyTorrentHistorySetting">保存</el-button>
        </el-form-item>
      </el-form>
      -->
      <el-table
        v-loading="tableLoading"
        :data="torrentList.slice((page - 1) * length, page * length)"
        size="small"
        @sort-change="sortList"
        style="width: 100%; font-size: 14px;">
        <!--
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
                <span>{{ props.row.recordNote }}</span>
              </el-form-item>
            </el-form>
          </template>
        </el-table-column>
        -->
        <el-table-column
          v-if="setting.showKeys.indexOf('site') !== -1"
          align="center"
          label="站点"
          sortable='custom'
          prop="site"
          width="144"
          >
          <template slot-scope="scope">
            <span style="font-size: 14px">{{scope.row.site}}</span>
            <br>
            <span style="font-size: 12px">{{scope.row.category}}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('title') !== -1"
          align="left"
          sortable='custom'
          prop="title"
          min-width="800px"
          label="种子">
          <template slot-scope="scope">
            <el-link style="font-size: 16px" @click="gotoDetail(scope.row)">{{scope.row.title}}</el-link>
            <el-link style="font-size: 12px" @click="gotoDetail(scope.row, true)">[代理登入]</el-link>
            <br>
            <span style="font-size: 12px">{{scope.row.subtitle}}</span>
            <br>
            <el-tag size="mini" v-for="tag of scope.row.tags" :key="tag">{{tag}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('users') !== -1"
          align="center"
          label="做种 / 下载 / 完成"
          sortable='custom'
          prop="seeders"
          width="200">
          <template slot-scope="scope">
            {{[scope.row.seeders, scope.row.leechers, scope.row.snatches].join(' / ')}}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('time') !== -1"
          align="center"
          sortable='custom'
          prop="time"
          label="发布时间"
          width="120">
          <template slot-scope="scope">
            {{scope.row.time ? $moment(scope.row.time * 1000).format('YYYY-MM-DD') : '∞' }}
            <br>
            {{scope.row.time ? $moment(scope.row.time * 1000).format('HH:mm:ss') : '' }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('size') !== -1"
          align="center"
          sortable='custom'
          prop="size"
          width="144"
          label="种子大小">
          <template slot-scope="scope">
            {{$formatSize(scope.row.size || 0)}}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('size') !== -1"
          align="center"
          prop="size"
          fixed="right"
          width="144"
          label="操作">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" @click="() => { pushTorrentVisible = true; pushRow = scope.row}">推送种子</el-button>
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('deleteTime') !== -1"
          align="center"
          label="删除时间"
          width="200">
          <template slot-scope="scope">
            {{scope.row.deleteTime ? $moment(scope.row.deleteTime * 1000).format('YYYY-MM-DD') : '∞' }}
            <br>
            {{scope.row.deleteTime ? $moment(scope.row.deleteTime * 1000).format('HH:mm:ss') : '' }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('state') !== -1"
          align="center"
          label="种子状态"
          width="144">
          <template slot-scope="scope">
            {{ scope.row.recordNote }}
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
    <el-dialog :modal-append-to-body='false' style="z-index: 999" title="推送种子" :visible.sync="pushTorrentVisible" width="50%">
      <el-form label-width="144px" size="mini" style="width: 80%;">
        <el-form-item required label="下载器">
          <el-select v-model="client" placeholder="选择下载器" style="width: 200px;">
            <el-option v-for="client of clientList" :disabled="!client.status" :key="client.id" :label="client.alias" :value="client.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="category" style="width: 200px;"></el-input>
        </el-form-item>
        <el-form-item label="保存路径">
          <el-input v-model="savePath" style="width: 200px;"></el-input>
        </el-form-item>
        <el-form-item label="自动管理">
          <el-checkbox v-model="autoTMM">自动管理</el-checkbox>
        </el-form-item>
        <el-form-item size="mini">
          <el-button type="primary" @click="pushTorrent">推送种子</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data () {
    return {
      client: '',
      autoTMM: false,
      category: '',
      savePath: '',
      checkList: [],
      searchSiteList: [],
      checkAll: true,
      checkAllSites: [],
      siteList: [],
      isIndeterminateSites: true,
      isIndeterminate: true,
      torrentList: [],
      clientList: [],
      rssList: [],
      setting: {
        showKeys: ['site', 'title', 'size', 'users', 'time']
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
      resultCount: [],
      searchKey: '',
      filterKey: '',
      pushRow: {},
      pushTorrentVisible: false,
      tableLoading: false,
      searchStatus: '搜索',
      total: 0,
      totalPage: 0,
      page: 1,
      length: 20,
      paginationShow: true
    };
  },
  methods: {
    async searchTorrent () {
      this.searchStatus = '搜索中...';
      this.tableLoading = true;
      const url = `/api/site/search?keyword=${this.searchKey}&sites=${encodeURIComponent(JSON.stringify(this.searchSiteList))}`;
      const res = await this.$axiosGet(url);
      this.torrentAll = res.data;
      this.checkList = this.torrentAll.map(i => i.site);
      this.refreshList();
      this.resultCount = this.torrentAll.map(i => {
        return {
          site: i.site,
          count: i.torrentList.length
        };
      }).sort((a, b) => b.count - a.count);
      this.searchStatus = '搜索';
      this.tableLoading = false;
    },

    async pushTorrent () {
      if (this.client === '') {
        return this.$message.error('请选择下载器');
      }
      let url = `/api/site/pushTorrent?id=${this.pushRow.id}&site=${this.pushRow.site}&client=${this.client}&autoTMM=${this.autoTMM}&savePath=${this.savePath}&category=${this.category}`;
      if (this.pushRow.downloadLink) {
        url += '&downloadLink=' + encodeURIComponent(this.pushRow.downloadLink);
      }
      const res = await this.$axiosGet(url);
      if (res) await this.$messageBox(res);
      this.pushTorrentVisible = false;
    },

    async filteTorrent () {
      this.refreshList();
      this.torrentList = this.torrentList.filter(i => {
        console.log(i);
        return i.title.indexOf(this.filterKey) !== -1 || i.subtitle.indexOf(this.filterKey) !== -1;
      });
      this.total = this.torrentList.length;
    },

    handleCheckAllChange (value) {
      this.checkList = value ? (this.torrentAll || []).map(i => i.site) : [];
      this.isIndeterminate = false;
    },

    handleCheckAllSitesChange (value) {
      this.searchSiteList = value ? this.siteList.map(i => i.name) : [];
      this.isIndeterminateSites = false;
    },

    refreshList () {
      this.torrentList = this.torrentAll.filter(i => this.checkList.indexOf(i.site) !== -1).map(i => i.torrentList).flat();
      this.isIndeterminate = this.checkList.length > 0 && this.checkList.length < this.resultCount.length;
      this.total = this.torrentList.length;
      sessionStorage.setItem('torrentList', JSON.stringify({
        torrentAll: this.torrentAll,
        searchKey: this.searchKey
      }));
    },

    sortList (option) {
      this.page = 1;
      if (this.torrentList.length === 0) return;
      if (typeof this.torrentList[0][option.prop] === 'string') {
        if (option.order === 'descending') {
          this.torrentList = this.torrentList.sort((a, b) => b[option.prop] < a[option.prop] ? -1 : 1);
        } else {
          this.torrentList = this.torrentList.sort((a, b) => a[option.prop] > b[option.prop] ? 1 : -1);
        }
      } else {
        if (option.order === 'descending') {
          this.torrentList = this.torrentList.sort((a, b) => b[option.prop] - a[option.prop]);
        } else {
          this.torrentList = this.torrentList.sort((a, b) => a[option.prop] - b[option.prop]);
        }
      }
    },

    async changePage (page) {
      this.page = page;
    },

    async listClient () {
      const res = await this.$axiosGet('/api/client/list');
      this.clientList = res ? res.data : [];
    },

    async listSite () {
      const res = await this.$axiosGet('/api/site/list');
      this.siteList = res ? res.data.siteList : [];
    },

    async gotoDetail (row, proxy) {
      if (!row.link) return await this.$message.error('链接不存在');
      window.open(proxy ? row.link.replace(/https:\/\/.*?\//, `/proxy/site/${row.site}/`) : row.link);
    }
  },
  async mounted () {
    this.listClient();
    this.listSite();
    const torrentList = sessionStorage.getItem('torrentList');
    if (torrentList) {
      const torrentListJson = JSON.parse(torrentList);
      this.torrentAll = torrentListJson.torrentAll;
      this.searchKey = torrentListJson.searchKey;
      this.checkList = this.torrentAll.map(i => i.site);
      this.refreshList();
      this.resultCount = this.torrentAll.map(i => {
        return {
          site: i.site,
          count: i.torrentList.length
        };
      }).sort((a, b) => b.count - a.count);
    }
  }
};
</script>

<style scoped>

.search-mix-form {
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
