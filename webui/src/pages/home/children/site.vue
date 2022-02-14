<template>
  <div class="site">
    <div class="radius-div">
      <el-table
        :data="siteList"
        :default-sort="{prop: 'alias'}"
        stripe
        style="margin: 20px">
        <el-table-column
          sortable
          prop="name"
          label="站点">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.display">
            </el-switch>
            {{ scope.row.display ? scope.row.name : '*******' }}
          </template>
        </el-table-column>
        <el-table-column
          sortable
          prop="info.uploaded"
          label="上传">
          <template slot-scope="scope">
            {{scope.row.info ? $formatSize(scope.row.info.uploaded) : ''}}
          </template>
        </el-table-column>
        <el-table-column
          sortable
          prop="info.downloaded"
          label="下载">
          <template slot-scope="scope">
            {{scope.row.info ? $formatSize(scope.row.info.downloaded) : ''}}
          </template>
        </el-table-column>
        <el-table-column
          sortable
          prop="info.seeding"
          label="做种/下载">
          <template slot-scope="scope">
            {{scope.row.info ? scope.row.info.seeding + ' / ' + scope.row.info.leeching : ''}}
          </template>
        </el-table-column>
        <el-table-column
          width="244">
          <template slot="header" slot-scope="scope">
            操作
            <el-button @click="refreshAll(scope)" type="primary" size="mini">{{refreshState}}</el-button>
          </template>
          <template slot-scope="scope">
            <el-button @click="refresh(scope.row)" type="primary" size="small">刷新</el-button>
            <el-button @click="modifySite(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button @click="deleteSite(scope.row)" :disabled="scope.row.used" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="siteCollapse">
        <el-collapse-item title="新增 | 编辑 站点" name="1">
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small">站点: {{site.name || '新增'}}</el-tag>
          </div>
          <el-form ref="site" class="site-form" :model="site" label-width="160px" size="mini">
            <el-form-item required label="站点" prop="name">
              <el-select v-model="site.name" style="width: 160px" placeholder="选择站点">
                <el-option v-for="item of sites" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item required label="启用" prop="enable">
              <el-checkbox v-model="site.enable">启用</el-checkbox>
            </el-form-item>
            <el-form-item required label="更新周期" prop="cron">
              <el-input v-model="site.cron" style="width: 300px;"></el-input>
              <div><el-tag type="info">Crontab 表达式, 默认 4 小时一次</el-tag></div>
            </el-form-item>
            <el-form-item required label="Cookie" prop="cookie">
              <el-input v-model="site.cookie" style="width: 500px;"></el-input>
            </el-form-item>
            <el-form-item size="small">
              <el-button type="primary" @click="handleSiteClick">新增 | 编辑</el-button>
              <el-button @click="clearSite">清空</el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      refreshState: '刷新全部站点',
      site: {},
      sites: ['Hares', 'CHDBits', 'LemonHD', 'HDChina', 'HDSky', 'HDHome', 'PTerClub', 'Audiences', 'OurBits'],
      defaultSite: {
        name: '',
        cookie: '',
        cron: '0 */4 * * *',
        enable: true
      },
      siteList: [],
      siteCollapse: ['1']
    };
  },
  methods: {
    async handleSiteClick () {
      this.$refs.site.validate(async (valid) => {
        if (valid) {
          const url = '/api/site/' + (this.site.id ? 'modify' : 'add');
          const res = await this.$axiosPost(url, this.site);
          if (!res) {
            return;
          }
          await this.$messageBox(res);
          this.listSite();
          this.clearSite();
        } else {
          return false;
        }
      });
    },
    async deleteSite (row) {
      const url = '/api/site/delete';
      const res = await this.$axiosPost(url, {
        name: row.name
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listSite();
      this.clearSite();
    },
    async modifySite (row) {
      this.siteCollapse = ['1'];
      this.site = { ...row };
    },
    async clearSite () {
      this.site = { ...this.defaultSite };
      this.$refs.site.resetFields();
    },
    async listSite () {
      const res = await this.$axiosGet('/api/site/list');
      const siteList = res ? res.data : [];
      for (const site of siteList) {
        site.display = site.display || true;
        console.log(site.display);
      }
      this.siteList = siteList;
    },
    async refreshAll () {
      this.refreshState = '刷新中 ......';
      const res = await this.$axiosGet('/api/site/refresh');
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listSite();
      this.refreshState = '刷新全部站点';
    },
    async refresh (row) {
      const res = await this.$axiosGet(`/api/site/refresh?name=${row.name}`);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listSite();
    }
  },
  async mounted () {
    this.site = { ...this.defaultSite };
    this.$refs.site.resetFields();
    this.listSite();
  }
};
</script>

<style scoped>
.site-div {
  margin: 20px 0;
}

.radius-div {
  border-radius: 8px;
  background: #FFFFFF;
}

.collapse {
  margin: 20px;
}

.site-form * {
  width: fit-content;
  text-align: left;
}
</style>
