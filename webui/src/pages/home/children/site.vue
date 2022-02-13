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
          width="200">
          <template slot="header" slot-scope="scope">
            操作
            <el-button @click="refreshAll(scope)" type="primary" size="mini">{{refreshState}}</el-button>
          </template>
          <template slot-scope="scope">
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
            <el-form-item required label="Cookie" prop="cookie">
              <el-input v-model="site.cookie" :rows="20" style="width: 500px;"></el-input>
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
      refreshState: '立即刷新全部站点',
      site: {},
      sites: ['Hares', 'CHDBits', 'LemonHD', 'HDChina', 'HDSky', 'HDHome', 'PTerClub', 'Audiences', 'OurBits'],
      defaultSite: {
        name: '',
        cookie: '',
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
        id: row.id
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
      this.siteList = res ? res.data : [];
    },
    async refreshAll () {
      this.refreshState = '刷新中 ......';
      const res = await this.$axiosGet('/api/site/refreshAll');
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listSite();
      this.refreshState = '立即刷新全部站点';
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
