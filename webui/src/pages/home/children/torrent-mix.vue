<template>
  <div class="torrent-mix">
    <div class="torrent-mix-div">
      <el-form class="client-mix-form" label-width="100px" size="mini">
        <el-form-item label="选择客户端">
          <el-checkbox-group @change="listTorrent" v-model="setting.clients">
            <el-checkbox v-for="client of clientList" :key="client.id" :label="client.id">{{client.alias}}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="排序规则">
          <el-select @change="listTorrent"  v-model="setting.sort.key" placeholder="排序字段">
            <el-option v-for="sortKey of sortKeys" :key="sortKey.key" :label="sortKey.value" :value="sortKey.key"></el-option>
          </el-select>
          <el-select @change="listTorrent"  v-model="setting.sort.type" placeholder="升降序">
            <el-option v-for="sortType of sortTypes" :key="sortType.key" :label="sortType.value" :value="sortType.key"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="展示内容">
          <el-checkbox-group v-model="setting.showKeys">
            <el-checkbox v-for="_key of keys" :key="_key.key" :label="_key.key">{{ _key.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item size="mini">
          <el-button type="primary" @click="modifyTorrentMixSetting">保存</el-button>
          <el-button type="primary" @click="listTorrent">刷新列表</el-button>
        </el-form-item>
      </el-form>
      <el-table
        :data="torrentList"
        size="small"
        stripe
        style="width: 100%; font-size: 14px;">
        <el-table-column type="expand" width="72">
          <template slot-scope="props">
            <el-form style="padding-left: 32px; width: 100%;" label-position="left" class="table-expand">
              <el-form-item label="客户端名">
                <span>{{ props.row.clientAlias }}</span>
              </el-form-item>
              <el-form-item label="种子名称">
                <span>{{ props.row.name }}</span>
              </el-form-item>
              <el-form-item label="种子大小">
                <span>{{ $formatSize(props.row.size || 0) }}</span>
              </el-form-item>
              <el-form-item label="上传速度">
                <span>{{ $formatSize(props.row.uploadSpeed || 0) }}/s</span>
              </el-form-item>
              <el-form-item label="下载速度">
                <span>{{ $formatSize(props.row.downloadSpeed || 0) }}/s</span>
              </el-form-item>
              <el-form-item label="连接数量">
                <span>↑ {{props.row.seeder}} / ↓ {{props.row.leecher}}</span>
              </el-form-item>
              <el-form-item label="种子分类">
                <span>{{props.row.category}}</span>
              </el-form-item>
              <el-form-item label="保存路径">
                <span>{{props.row.savePath}}</span>
              </el-form-item>
              <el-form-item label="种子状态">
                <span>{{ props.row.state }}</span>
              </el-form-item>
              <el-form-item label="添加时间">
                <span>{{ $moment(props.row.addedTime * 1000).format('YYYY-MM-DD HH:mm:ss') }}</span>
              </el-form-item>
              <el-form-item label="完成时间">
                <span>{{$moment().unix() > props.row.completedTime ? $moment(props.row.completedTime * 1000).format('YYYY-MM-DD HH:mm:ss') : '∞' }}</span>
              </el-form-item>
              <el-form-item label="上传流量">
                <span>{{ $formatSize(props.row.uploaded || 0) }}</span>
              </el-form-item>
              <el-form-item label="下载流量">
                <span>{{ $formatSize(props.row.downloaded || 0) }}</span>
              </el-form-item>
              <el-form-item label="站点域名">
                <span>{{ props.row.tracker }}</span>
              </el-form-item>
              <el-form-item label="种子链接">
                <el-link type="primary" @click="gotoDetail(props.row)" style="line-height: 24px">{{ props.row.link || '无' }}</el-link>
              </el-form-item>
            </el-form>
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('clientAlias') !== -1"
          align="center"
          label="客户端"
          width="144">
          <template slot-scope="scope">
            {{scope.row.clientAlias}}
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
          v-if="setting.showKeys.indexOf('category') !== -1"
          align="center"
          label="种子分类"
          width="144">
          <template slot-scope="scope">
            {{scope.row.category}}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('speed') !== -1"
          align="center"
          label="种子速度"
          width="144">
          <template slot-scope="scope">
            {{$formatSize(scope.row.uploadSpeed || 0)}}/s
            <br>
            {{$formatSize(scope.row.downloadSpeed || 0)}}/s
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('flow') !== -1"
          align="center"
          label="种子数据"
          width="144">
          <template slot-scope="scope">
            {{$formatSize(scope.row.uploaded || 0)}}
            <br>
            {{$formatSize(scope.row.downloaded || 0)}}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('addedTime') !== -1"
          align="center"
          label="添加时间"
          width="200">
          <template slot-scope="scope">
            {{$moment(scope.row.addedTime * 1000).format('YYYY-MM-DD HH:mm:ss')}}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('completedTime') !== -1"
          align="center"
          label="完成时间"
          width="200">
          <template slot-scope="scope">
            {{$moment().unix() > scope.row.completedTime ? $moment(scope.row.completedTime * 1000).format('YYYY-MM-DD HH:mm:ss') : '∞' }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="setting.showKeys.indexOf('state') !== -1"
          align="center"
          label="种子状态"
          width="144">
          <template slot-scope="scope">
            {{ scope.row.state }}
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
      torrentInfo: {
        ratio: 0
      },
      clientList: [],
      total: 0,
      totalPage: 0,
      page: 1,
      length: 20,
      setting: {
        showKeys: ['clientAlias', 'name', 'size', 'flow', 'link', 'speed'],
        sort: {
        },
        clients: []
      },
      keys: [{
        key: 'name',
        name: '种子名称'
      }, {
        key: 'clientAlias',
        name: '客户端名'
      }, {
        key: 'size',
        name: '种子大小'
      }, {
        key: 'category',
        name: '种子分类'
      }, {
        key: 'state',
        name: '种子状态'
      }, {
        key: 'speed',
        name: '种子速度'
      }, {
        key: 'flow',
        name: '种子数据'
      }, {
        key: 'addedTime',
        name: '添加时间'
      }, {
        key: 'completedTime',
        name: '完成时间'
      }, {
        key: 'link',
        name: '种子链接'
      }],
      searchKey: '',
      sortKeys: [
        {
          key: 'name',
          value: '名称'
        }, {
          key: 'uploadSpeed',
          value: '上传速度'
        }, {
          key: 'downloadSpeed',
          value: '下载速度'
        }, {
          key: 'uploaded',
          value: '已上传'
        }, {
          key: 'downloaded',
          value: '已下载'
        }, {
          key: 'tracker',
          value: 'Tracker'
        }
      ],
      sortTypes: [
        {
          key: 'asc',
          value: '升序'
        }, {
          key: 'desc',
          value: '降序'
        }
      ],
      paginationShow: true
    };
  },
  methods: {
    async listTorrent () {
      let url = `/api/torrent/list?clientList=${encodeURIComponent(JSON.stringify(this.setting.clients))}&page=${this.page}&length=${this.length}`;
      if (this.setting.sort.key) {
        url += `&sortKey=${this.setting.sort.key}`;
      }
      if (this.setting.sort.type) {
        url += `&sortType=${this.setting.sort.type}`;
      }
      const res = await this.$axiosGet(url);
      this.total = res ? res.data.total : 0;
      this.torrentList = res ? res.data.torrents : [];
    },

    async queryDetail (row) {
      this.torrentInfo = row;
      this.torrentInfoVisible = true;
    },

    async gotoDetail (row) {
      if (!row.link) return await this.$message.error('链接不存在');
      window.open(row.link);
    },

    async changePage (page) {
      this.torrents = [];
      this.page = page;
      const url = `/torrent-mix?clientList=${encodeURIComponent(JSON.stringify(this.setting.clients))}&page=${page}&length=${this.length}`;
      this.$router.push(url);
      await this.listTorrent();
    },

    async listClient () {
      const res = await this.$axiosGet('/api/client/list');
      this.clientList = res ? res.data.filter(item => item.enable).sort((a, b) => a.name > b.name ? 1 : -1) : [];
    },

    async getTorrentMixSetting () {
      const url = '/api/setting/getTorrentMixSetting';
      const res = await this.$axiosGet(url);
      this.setting = {
        ...res.data,
        showKeys: res.data.showKeys || ['clientAlias', 'name', 'size', 'flow', 'link', 'speed'],
        sort: {},
        clients: res.data.clients || JSON.parse(this.$route.query.clients || '[]')
      };
    },

    async modifyTorrentMixSetting () {
      const url = '/api/setting/modifyTorrentMixSetting';
      const res = await this.$axiosPost(url, this.setting);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
    }
  },
  async mounted () {
    await this.listClient();
    await this.getTorrentMixSetting();
    this.listTorrent();
    /*
    this.freshTorrent = setInterval(() => {
      this.listTorrent();
    }, 5000);
    */
  },
  beforeDestroy () {
    clearInterval(this.freshTorrent);
  }
};
</script>

<style scoped>
.torrent-mix-div {
  padding: 8px;
  border-radius: 8px;
  background: #FFF;
}

.client-mix-form {
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

.el-table__expand-column .cell {
  width: 48px;
  height: 48px;
  padding-left: 0;
  padding-right: 0;
}
</style>
