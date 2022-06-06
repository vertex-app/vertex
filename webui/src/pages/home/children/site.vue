<template>
  <div class="site">
    <div class="radius-div">
      <div style="margin: 20px 32px; padding-top:20px;">
        <el-descriptions title="数据统计" :column="4">
          <el-descriptions-item label="今日">{{$formatSize(siteInfo.data ? siteInfo.data.increase.today.total.upload : 0)}}</el-descriptions-item>
          <el-descriptions-item label="本周">{{$formatSize(siteInfo.data ? siteInfo.data.increase.week.total.upload : 0)}}</el-descriptions-item>
          <el-descriptions-item label="本月">{{$formatSize(siteInfo.data ? siteInfo.data.increase.month.total.upload : 0)}}</el-descriptions-item>
          <el-descriptions-item label="累计">{{$formatSize((siteInfo.data && siteInfo.data.siteList.length !== 0) ? siteInfo.data.siteList.reduce((a, b) => (a.upload || a) + b.upload) : 0)}}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form class="site-push-setting-form" inline label-width="100px" size="mini">
        <el-form-item label="推送通知" prop="push">
          <el-checkbox v-model="setting.push">推送通知</el-checkbox>
        </el-form-item>
        <el-form-item label="定时推送">
          <el-input v-model="setting.cron" placeholder="Crontab 表达式" style="width: 144px;"/>
        </el-form-item>
        <el-form-item label="通知方式" prop="pushTo">
          <el-select v-model="setting.pushTo" placeholder="请选择 通知方式" style="width: 144px;">
            <el-option v-for="push of pushList" :key="push.id" :label="push.alias" :value="push.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item size="mini">
          <el-button type="primary" @click="modifySitePushSetting">保存</el-button>
        </el-form-item>
      </el-form>
      <el-table
        :data="siteList"
        :default-sort="{prop: 'alias'}"
        style="margin: 20px">
        <el-table-column
          prop="name"
          label="站点"
          min-width="180">
          <template slot="header" slot-scope="scope">
            <el-switch
              v-model="displayAll">
            </el-switch>
            站点
          </template>
          <template slot-scope="scope">
            <el-switch
              @change="test(scope)"
              :value="(scope.row.display && displayAll)">
            </el-switch>
            {{ scope.row.display && displayAll ? scope.row.name : '*******' }}
          </template>
        </el-table-column>
        <el-table-column
          sortable
          prop="username"
          label="用户名"
          min-width="144">
          <template slot-scope="scope">
            {{ scope.row.display ? scope.row.username : '*******' }}
          </template>
        </el-table-column>
        <el-table-column
          sortable
          prop="upload"
          label="上传"
          min-width="144">
          <template slot-scope="scope">
            {{$formatSize(scope.row.upload || 0)}}
          </template>
        </el-table-column>
        <el-table-column
          sortable
          prop="download"
          label="下载"
          min-width="144">
          <template slot-scope="scope">
            {{$formatSize(scope.row.download || 0)}}
          </template>
        </el-table-column>
        <el-table-column
          sortable
          prop="seeding_size"
          label="做种/体积"
          min-width="144">
          <template slot-scope="scope">
            {{scope.row.seeding + ' / ' + $formatSize(scope.row.seedingSize || 0)}}
          </template>
        </el-table-column>
        <el-table-column
          sortable
          prop="updateTime"
          min-width="180"
          label="上次刷新时间">
          <template slot-scope="scope">
            {{scope.row.updateTime ? $moment(scope.row.updateTime * 1000).format('YYYY-MM-DD HH:mm:ss') : '∞'}}
          </template>
        </el-table-column>
        <el-table-column
          width="320"
          align="center"
          fixed="right">
          <template slot="header" slot-scope="scope">
            操作
            <el-button @click="refreshAll(scope)" type="primary" size="mini">{{refreshState}}</el-button>
          </template>
          <template slot-scope="scope">
            <el-button @click="gotoSite(scope.row)" type="primary" size="small">打开</el-button>
            <el-button @click="refresh(scope.row)" :disabled="!scope.row.enable" type="primary" size="small">{{ scope.row.enable ? '刷新' : '停用' }}</el-button>
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
                <el-option :disabled="siteList.filter(i => i.name === item).length !== 0" v-for="item of sites" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item required label="启用" prop="enable">
              <el-checkbox v-model="site.enable" :disabled="site.used">启用</el-checkbox>
            </el-form-item>
            <el-form-item label="更新周期" prop="cron">
              <el-input v-model="site.cron" style="width: 300px;"></el-input>
              <div><el-tag type="info">Crontab 表达式, 默认每天的 11:55 与 23:55 各更新一次</el-tag></div>
            </el-form-item>
            <el-form-item label="最大重试次数" prop="maxRetryCount">
              <el-input v-model="site.maxRetryCount" style="width: 200px;"></el-input>
              <div><el-tag type="info">数据刷新失败时自动重试次数, 留空则默认为 5</el-tag></div>
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
      sites: ['HaresClub', 'CHDBits', 'LemonHD', 'HDChina',
        'HDSky', 'HDHome', 'PTerClub', 'Audiences', 'OurBits',
        'SpringSunDay', 'MTeam', 'OpenCD', 'U2', 'BeiTai',
        'TCCF', 'TLFBits', 'PTMSG', 'HDFans', 'DICMusic', 'GPW',
        'BTSchool', 'TJUPT', 'ToTheGlory', 'KeepFriends', 'HDDolby',
        'HDArea', 'SoulVoice', 'PTHome', 'NYPT'].sort(),
      defaultSite: {
        name: '',
        cookie: '',
        cron: '55 11,23 * * *',
        enable: true
      },
      setting: {},
      siteInfo: {},
      displayAll: true,
      siteList: [],
      pushList: [],
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
      if (!res) return;
      this.siteInfo = res;
      this.loadSite();
    },
    loadSite () {
      this.siteList = [];
      const siteList = this.siteInfo.data.siteList;
      for (const site of siteList) {
        site.id = site.name;
        site.display = site.display === undefined ? true : site.display;
        this.siteList.push({ ...site });
      }
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
    },

    test (scope) {
      scope.row.display = !scope.row.display;
      console.log(scope.row);
    },

    async listPush () {
      const res = await this.$axiosGet('/api/push/list');
      this.pushList = res ? res.data : [];
    },

    async getSitePushSetting () {
      const url = '/api/setting/getSitePushSetting';
      const res = await this.$axiosGet(url);
      this.setting = res.data;
      this.setting.cron = this.setting.cron || '0 9,21 * * *';
    },

    async modifySitePushSetting () {
      const url = '/api/setting/modifySitePushSetting';
      const res = await this.$axiosPost(url, this.setting);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
    },

    gotoSite (row) {
      window.open(`/proxy/site/${row.name}/`);
    }
  },
  async mounted () {
    this.site = { ...this.defaultSite };
    this.$refs.site.resetFields();
    this.listSite();
    this.listPush();
    this.getSitePushSetting();
  }
};
</script>

<style scoped>
.collapse {
  margin: 20px;
}

.site-form * {
  width: fit-content;
  text-align: left;
}

.site-push-setting-form {
  padding: 20px 0;
  margin: 20px 0;
  width: fit-content;
  text-align: left;
}

.chart {
  height: 600px;
}
</style>
