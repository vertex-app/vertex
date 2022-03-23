<template>
  <div class="home">
    <div class="radius-div">
      <el-table
        :data="clientList"
        :default-sort="{prop: 'alias'}"
        style="margin: 20px">
        <el-table-column
          sortable
          prop="alias"
          label="别名"
          width="144px">
        </el-table-column>
        <el-table-column
          min-width="272px">
          <template slot="header" slot-scope="scope">
            <el-switch
              v-model="urlDisplay">
            </el-switch>
            WebUI - Url
          </template>
          <template slot-scope="scope">
            {{ urlDisplay ? scope.row.clientUrl : '**********' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="type"
          label="下载器类型"
          width="144px">
        </el-table-column>
        <el-table-column
          label="上传速度 / 下载速度"
          min-width="256px">
          <template slot-scope="scope">
            {{scope.row.status ? `${$formatSize(scope.row.uploadSpeed)}/s / ${$formatSize(scope.row.downloadSpeed)}/s` : null}}
          </template>
        </el-table-column>
        <el-table-column
          label="历史上传 / 历史下载"
          min-width="256px">
          <template slot-scope="scope">
            {{scope.row.status ? `${$formatSize(scope.row.allTimeUpload)} / ${$formatSize(scope.row.allTimeDownload)}` : null}}
          </template>
        </el-table-column>
        <el-table-column
          label="做种 / 下载"
          min-width="144px">
          <template slot-scope="scope">
            {{scope.row.status ? `${scope.row.seedingCount} / ${scope.row.leechingCount}` : null}}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="80px">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status ? '' : 'danger'">{{scope.row.enable ? scope.row.status ? '正常' : '连接失败' : '未启用'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="244px">
          <template slot-scope="scope">
            <el-button @click="gotoClient(scope.row)" type="primary" size="small">打开下载器</el-button>
            <el-button style="margin-left: 0" @click="gotoTorrentList(scope.row)" type="primary" size="small">种子列表</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-table
        :data="serverList"
        :default-sort="{prop: 'alias'}"
        style="margin: 20px">
        <el-table-column
          sortable
          prop="alias"
          label="别名"
          width="144px">
        </el-table-column>
        <el-table-column
          min-width="160px">
          <template slot="header" slot-scope="scope">
            <el-switch
              v-model="hostDisplay">
            </el-switch>
            IP / 域名
          </template>
          <template slot-scope="scope">
            {{ hostDisplay ? scope.row.host : '**********' }}
          </template>
        </el-table-column>
        <el-table-column
          label="CPU"
          width="80px">
          <template slot-scope="scope">
            {{cpuUse[scope.row.id] ? (100 - cpuUse[scope.row.id].all.idle).toFixed(2) + '%' : null}}
          </template>
        </el-table-column>
        <el-table-column
          label="上传速度 / 下载速度"
          min-width="256px">
          <template slot-scope="scope">
            {{netSpeed[scope.row.id] ? `${$formatSize(netSpeed[scope.row.id][0].txBytes)}/s / ${$formatSize(netSpeed[scope.row.id][0].rxBytes)}/s` : null}}
          </template>
        </el-table-column>
        <el-table-column
          label="启用"
          width="80px">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enable ? '' : 'danger'">{{scope.row.enable}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="80px">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status ? '' : 'danger'">{{scope.row.status ? '正常' : '连接失败'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="244px">
          <template slot-scope="scope">
            <el-button @click="gotoClient(scope.row)" type="primary" :disabled="!scope.row.bindClient" size="small">下载器</el-button>
            <el-button style="margin-left: 0" @click="reloadServer(scope.row)" type="warning" size="small">重连</el-button>
            <el-button style="margin-left: 0" :disabled="!scope.row.status" @click="displayDetails(scope.row)" type="primary" size="small">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="clientCollapse">
        <el-collapse-item :title="`${server.alias || ''} 详情`" name="1">
          <div class="server-status home-div">
            <v-chart v-if="server.id" class="chart" :option="chart" autoresize />
            <el-row
              class="row"
              type="flex"
              justify="space-between"
              align="top">
              <el-col :span="12" class="progress-div">
                <v-chart style="height: 300px" :option="networkChart" autoresize />
              </el-col>
              <el-col :span="12" class="progress-div">
                <div class="vnstat home-div">
                  <el-table
                    :data="vnstat[vnstatPeriod].interfaces[0].traffic[vnstatPeriod]"
                    size="mini">
                    <el-table-column
                      width="200">
                      <template slot="header" slot-scope="scope">
                        <el-select size="mini" v-model="vnstatPeriod" @change="handlePeriod" placeholder="选择周期">
                          <el-option label="5 分钟" value="fiveminute"></el-option>
                          <el-option label="时" value="hour"></el-option>
                          <el-option label="日" value="day"></el-option>
                          <el-option label="月" value="month"></el-option>
                        </el-select>
                      </template>
                      <template slot-scope="scope">
                        {{formatTime(scope.row)}}
                      </template>
                    </el-table-column>
                    <el-table-column
                      :formatter="(row) => $formatSize(row.tx)"
                      label="↑">
                    </el-table-column>
                    <el-table-column
                      :formatter="(row) => $formatSize(row.rx)"
                      label="↓">
                    </el-table-column>
                  </el-table>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
    <div class="radius-div">
      <div style="margin: 20px; padding: 20px 0;">
        <v-chart class="chart" :option="tracker" autoresize />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      serverList: [],
      clientList: [],
      netSpeed: {},
      cpuUse: {},
      diskUse: {},
      memoryUse: {},
      server: {},
      clientCollapse: [],
      vnstat: {
        fiveminute: {
          interfaces: [
            {
              traffic: {
                fiveminute: []
              }
            }
          ]
        },
        hour: {
          interfaces: [
            {
              traffic: {
                hour: []
              }
            }
          ]
        },
        day: {
          interfaces: [
            {
              traffic: {
                day: []
              }
            }
          ]
        },
        month: {
          interfaces: [
            {
              traffic: {
                month: []
              }
            }
          ]
        }
      },
      vnstatPeriod: 'day',
      usernameDisplay: true,
      hostDisplay: true,
      urlDisplay: true,
      customColors: [
        { color: '#90EE90', percentage: 20 },
        { color: '#48D1CC', percentage: 40 },
        { color: '#00BFFF', percentage: 60 },
        { color: '#DC143C', percentage: 80 },
        { color: '#FF00FF', percentage: 100 }
      ],
      tracker: {
        title: {
          text: 'Tracker 速度',
          left: 'center'
        },
        grid: {
          top: 120,
          left: 90,
          right: 20,
          bottom: 40
        },
        legend: {
          top: 64,
          left: '10%',
          width: '80%'
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
              const size = this.$formatSize(param.value) + '/s';
              str += `${param.seriesName}: ${'&nbsp;'.repeat(40 - size.length - param.seriesName.length || 1)}${size}<br>`;
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
            formatter: item => this.$formatSize(item) + '/s'
          }
        },
        graphic: [
          {
            type: 'image',
            id: 'logo',
            right: 20,
            top: 20,
            z: -1,
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
      chartSeries: [],
      xAxis: {},
      chart: {
        title: {
          text: '流量曲线',
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
            let str = '';
            for (const param of params) {
              const size = this.$formatSize(param.value);
              str += `${param.seriesName}: ${'&nbsp;'.repeat(16 - size.length || 1)}${size}</br>`;
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
        series: [
          {
            name: 'Tx - 上传',
            type: 'line',
            data: [],
            symbol: 'none',
            areaStyle: {
              opacity: 0.1
            },
            itemStyle: {
              color: '#EE6363'
            },
            smooth: true
          }, {
            name: 'Rx - 下载',
            type: 'line',
            data: [],
            symbol: 'none',
            areaStyle: {
              opacity: 0.1
            },
            itemStyle: {
              color: '#3CB371'
            },
            smooth: true
          }
        ]
      },
      networkChart: {
        title: {
          text: '网络速率',
          left: 'center'
        },
        grid: {
          top: 40,
          left: 90,
          right: 20,
          bottom: 40
        },
        legend: {
          top: '8%'
        },
        textStyle: {
          fontFamily: 'consolas',
          color: '#000'
        },
        darkMode: true,
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            let str = '';
            for (const param of params) {
              const speed = this.$formatSize(param.value) + '/s';
              str += `${param.seriesName}: ${'&nbsp;'.repeat(16 - speed.length)}${speed}</br>`;
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
        series: [
          {
            name: 'Tx - 上传',
            type: 'line',
            data: [],
            symbol: 'none',
            areaStyle: {
              opacity: 0.1
            },
            itemStyle: {
              color: '#EE6363'
            },
            smooth: true
          }, {
            name: 'Rx - 下载',
            type: 'line',
            data: [],
            symbol: 'none',
            areaStyle: {
              opacity: 0.1
            },
            itemStyle: {
              color: '#3CB371'
            },
            smooth: true
          }
        ]
      }
    };
  },
  methods: {
    handlePeriod (vnstatPeriod) {
      const sortedArr = this.vnstat[this.vnstatPeriod].interfaces[0].traffic[this.vnstatPeriod];
      this.chart.xAxis.data = sortedArr.map(item => this.formatTime(item).slice(-5)).reverse();
      this.chart.series[0].data = sortedArr.map(item => item.tx).reverse();
      this.chart.series[1].data = sortedArr.map(item => item.rx).reverse();
    },
    async displayDetails (row) {
      this.server = row;
      await this.getVnstat();
      await this.getDiskUse();
      await this.getMemoryUse();
      this.networkChart.xAxis.data = [];
      this.networkChart.series[0].data = [];
      this.networkChart.series[1].data = [];
      this.handlePeriod(this.vnstatPeriod);
      this.clientCollapse = ['1'];
    },
    formatTime (row) {
      if (typeof row.date === 'string') return row.date;
      return `${row.date.year}-${row.date.month < 10 ? '0' + row.date.month : row.date.month}` +
        (row.date.day ? `-${row.date.day < 10 ? '0' + row.date.day : row.date.day}` : '') +
        (row.time
          ? ` ${row.time.hour < 10
            ? '0' +
        row.time.hour
            : row.time.hour}:${row.time.minute < 10
            ? '0' +
        row.time.minute
            : row.time.minute}`
          : '');
    },
    async getNetSpeed () {
      const res = await this.$axiosGet('/api/server/netSpeed?_=' + Math.random());
      if (!res) {
        return;
      }
      const netSpeed = {};
      for (const key of Object.keys(res.data)) {
        netSpeed[key] = res.data[key].sort((a, b) => b.txBytes - a.txBytes);
      }
      this.netSpeed = netSpeed;
      if (this.server.id) {
        this.networkChart.xAxis.data.push(this.$moment().format('mm:ss'));
        this.networkChart.series[0].data.push(netSpeed[this.server.id][0].txBytes);
        this.networkChart.series[1].data.push(netSpeed[this.server.id][0].rxBytes);
      }
    },
    async getServerList () {
      const res = await this.$axiosGet('/api/server/list?_=' + Math.random());
      if (!res) {
        return;
      }
      this.serverList = res.data;
    },
    async getCpuUse () {
      const res = await this.$axiosGet('/api/server/cpuUse?_=' + Math.random());
      if (!res) {
        return;
      }
      this.cpuUse = res.data;
    },
    async getDiskUse () {
      const res = await this.$axiosGet('/api/server/diskUse?_=' + Math.random());
      if (!res) {
        return;
      }
      const diskUse = {};
      for (const key of Object.keys(res.data)) {
        diskUse[key] = res.data[key].sort((a, b) => b.size - a.size);
      }
      this.diskUse = diskUse;
    },
    async getVnstat () {
      const res = await this.$axiosGet('/api/server/vnstat?_=' + Math.random() + '&id=' + this.server.id);
      if (!res) {
        return;
      }
      this.vnstat = res.data;
      for (const key of Object.keys(this.vnstat)) {
        this.vnstat[key].interfaces = this.vnstat[key].interfaces.sort((a, b) => b.traffic.total.rx - a.traffic.total.rx);
      }
      this.vnstat.day.interfaces[0].traffic.day = this.vnstat.day.interfaces[0].traffic.day
        .sort((a, b) => this.$moment(this.formatTime(b)).unix() - this.$moment(this.formatTime(a)).unix());
      this.vnstat.month.interfaces[0].traffic.month = this.vnstat.month.interfaces[0].traffic.month
        .sort((a, b) => this.$moment(this.formatTime(b)).unix() - this.$moment(this.formatTime(a)).unix());
      this.vnstat.fiveminute.interfaces[0].traffic.fiveminute = this.vnstat.fiveminute.interfaces[0].traffic.fiveminute
        .sort((a, b) => this.$moment(this.formatTime(b)).unix() - this.$moment(this.formatTime(a)).unix());
      this.vnstat.hour.interfaces[0].traffic.hour = this.vnstat.hour.interfaces[0].traffic.hour
        .sort((a, b) => this.$moment(this.formatTime(b)).unix() - this.$moment(this.formatTime(a)).unix());
      const today = this.vnstat.day.interfaces[0].traffic.day[0];
      if (today) {
        const estimated = { ...today };
        estimated.id += 1;
        estimated.date = '预计今日';
        estimated.rx = parseInt(estimated.rx * 3600 * 24 / (this.$moment().diff(this.$moment().startOf('day'), 'seconds')));
        estimated.tx = parseInt(estimated.tx * 3600 * 24 / (this.$moment().diff(this.$moment().startOf('day'), 'seconds')));
        this.vnstat.day.interfaces[0].traffic.day.unshift(estimated);
      }
    },
    async getMemoryUse () {
      const res = await this.$axiosGet('/api/server/memoryUse?_=' + Math.random());
      if (!res) {
        return;
      }
      this.memoryUse = res.data;
    },
    async reloadServer (row) {
      const res = await this.$axiosGet('/api/server/reload?id=' + row.id);
      await this.$messageBox(res);
      this.getServerList();
    },
    async listClient () {
      const res = await this.$axiosGet('/api/client/list?_=' + Math.random());
      this.clientList = res ? res.data : [];
    },
    async listTrackerHistory () {
      const res = await this.$axiosGet('/api/setting/getTrackerFlowHistory');
      if (!res) return;
      this.trackerInfo = res;
      this.loadTracker();
    },
    loadTracker () {
      const recordList = this.trackerInfo.data.trackers;
      const template = {
        name: '',
        type: 'line',
        data: [],
        symbol: 'none',
        areaStyle: {
          opacity: 0.2
        },
        smooth: true
      };
      this.tracker.series = [];
      const dateSet = this.trackerInfo.data.timeGroup;
      for (const _tracker of Object.keys(recordList)) {
        const trackerRecord = recordList[_tracker];
        const tracker = { ...template };
        tracker.data = Object.keys(trackerRecord).map(i => trackerRecord[i].upload);
        tracker.name = _tracker;
        this.tracker.series.push(tracker);
      }
      if (this.tracker.series[0]) {
        const total = [];
        for (const [i, v] of this.tracker.series[0].data.entries()) {
          for (const series of this.tracker.series) {
            if (total[i]) {
              total[i] += series.data[i];
            } else {
              total[i] = series.data[i];
            }
          }
        }
        const t = { ...template };
        t.name = 'Total';
        t.data = total;
        this.tracker.series.push(t);
      }
      this.tracker.xAxis.data = dateSet.map(i => this.$moment(i * 1000).format('YYYY-MM-DD HH:mm'));
    },
    gotoClient (row) {
      if (row.clientUrl) {
        window.open(`/proxy/client/${row.id}/`);
      } else {
        const url = `/proxy/client/${row.bindClient}/`;
        window.open(url);
      }
    },
    gotoTorrentList (row) {
      this.$router.push('/hit-and-run/torrent-mix?clients=' + JSON.stringify([row.id]));
    }
  },
  async mounted () {
    await Promise.all([this.getNetSpeed(), this.getCpuUse(), this.getServerList()]);
    await this.listClient();
    await this.listTrackerHistory();
    this.freshData = setInterval(() => {
      this.getNetSpeed();
      this.getCpuUse();
      this.listClient();
    }, 5000);
  },
  beforeDestroy () {
    clearInterval(this.freshData);
  }
};
</script>

<style scoped>
.collapse {
  margin: 20px;
}

.chart {
  height: 400px;
  color: #000
}
</style>
