<template>
  <div class="site">
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="siteCollapse">
        <el-collapse-item title="流量历史" name="1">
          <v-chart class="chart" :option="chart" autoresize />
        </el-collapse-item>
      </el-collapse>
    </div>
    <div class="radius-div">
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
          sortable
          prop="name"
          label="站点"
          min-width="180">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.display"
              @change="loadSite">
            </el-switch>
            {{ scope.row.display ? scope.row.name : '*******' }}
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
            {{scope.row.seeding + ' / ' + scope.row.seedingSize}}
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
                <el-option :disabled="siteList.filter(i => i.name === item).length !== 0" v-for="item of sites" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item required label="启用" prop="enable">
              <el-checkbox v-model="site.enable">启用</el-checkbox>
            </el-form-item>
            <el-form-item label="更新周期" prop="cron">
              <el-input v-model="site.cron" style="width: 300px;"></el-input>
              <div><el-tag type="info">Crontab 表达式, 默认 4 小时一次</el-tag></div>
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
        'TCCF', 'TLFBits', 'PTMSG', 'HDFans', 'DICMusic', 'GPW', 'BTSchool', 'TJUPT'].sort(),
      defaultSite: {
        name: '',
        cookie: '',
        cron: '0 */4 * * *',
        enable: true
      },
      chart: {
        title: {
          text: '历史记录',
          left: 'center'
        },
        grid: {
          top: 40,
          left: 90,
          right: 20,
          bottom: 40
        },
        legend: {
          top: '7%'
        },
        textStyle: {
          fontFamily: 'consolas',
          color: '#000'
        },
        darkMode: true,
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            let str = params[0].axisValue + '</br>';
            params = params.sort((a, b) => b.value - a.value);
            for (const param of params) {
              const size = this.$formatSize(param.value);
              const increase = this.$formatSize(this.chart.series[param.seriesIndex].data[param.dataIndex] - (this.chart.series[param.seriesIndex].data[param.dataIndex - 1] || 0));
              str += `${param.seriesName}: ${'&nbsp;'.repeat(25 - size.length - param.seriesName.length || 1)}${size}` +
                `, ↑ ${'&nbsp;'.repeat(12 - increase.length || 1)}${increase}</br>`;
            }
            return str;
          }
        },
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: this.$formatSize
          }
        },
        graphic: [
          {
            type: 'image',
            id: 'logo',
            right: 20,
            top: 40,
            z: 999,
            bounding: 'raw',
            origin: [125, 125],
            style: {
              image: '/assets/images/Vertex.svg',
              width: 64,
              height: 64,
              opacity: 0.8
            }
          }
        ],
        series: []
      },
      setting: {},
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
      const recordList = this.siteInfo.data.sites;
      const siteList = this.siteInfo.data.siteList;
      const template = {
        name: '',
        type: 'line',
        data: [],
        symbol: 'none',
        areaStyle: {
          opacity: 0.1
        },
        smooth: true
      };
      this.chart.series = [];
      const dateSet = this.siteInfo.data.timeGroup;
      for (const site of Object.keys(recordList)) {
        if (siteList.filter(item => item.name === site)[0].display === false) {
          continue;
        }
        const siteRecord = recordList[site];
        const siteLine = { ...template };
        siteLine.data = Object.keys(siteRecord).map(i => siteRecord[i].upload);
        siteLine.name = site;
        this.chart.series.push(siteLine);
      }
      this.chart.xAxis.data = dateSet.map(i => this.$moment(i * 1000).format('YYYY-MM-DD HH:mm'));
      for (const site of siteList) {
        site.display = site.display === undefined ? true : site.display;
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
.site-div {
  margin: 20px 0;
}

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
