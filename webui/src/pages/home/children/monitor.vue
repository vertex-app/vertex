<template>
  <div class="home">
    <div class="radius-div">
      <el-table
        :data="clientList"
        stripe
        style="margin: 20px">
        <el-table-column
          prop="clientAlias"
          label="别名"
          width="200px">
        </el-table-column>
        <el-table-column>
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
          label="客户端类型">
        </el-table-column>
        <el-table-column
          label="↑/↓">
          <template slot-scope="scope">
            {{scope.row.status ? `${$formatSize(scope.row.uploadSpeed)}/s / ${$formatSize(scope.row.downloadSpeed)}/s` : null}}
          </template>
        </el-table-column>
        <el-table-column
          label="状态">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status ? '' : 'danger'">{{scope.row.enable ? scope.row.status ? '正常' : '连接失败' : '未启用'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作">
          <template slot-scope="scope">
            <el-button @click="gotoClient(scope.row)" type="primary" size="small">打开客户端</el-button>
            <el-button @click="gotoTorrentList(scope.row)" type="primary" size="small">种子列表</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-table
        :data="serverList"
        stripe
        style="margin: 20px">
        <el-table-column
          prop="alias"
          label="别名"
          width="200px">
        </el-table-column>
        <el-table-column>
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
          label="↑/↓">
          <template slot-scope="scope">
            {{netSpeed[scope.row.id] ? `${$formatSize(netSpeed[scope.row.id][0].txBytes)}/s / ${$formatSize(netSpeed[scope.row.id][0].rxBytes)}/s` : null}}
          </template>
        </el-table-column>
        <el-table-column
          label="启用">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enable ? '' : 'danger'">{{scope.row.enable}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="状态">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status ? '' : 'danger'">{{scope.row.status ? '正常' : '连接失败'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="244px">
          <template slot-scope="scope">
            <el-button @click="gotoClient(scope.row)" type="primary" :disabled="!scope.row.bindClient" size="small">客户端</el-button>
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
                <el-row
                  class="row"
                  type="flex"
                  justify="space-between"
                  align="top">
                  <el-col :span="11" class="progress-div">
                    <v-chart style="width: 300px; height: 300px" :option="memoryChart" autoresize />
                  </el-col>
                  <el-col :span="11" class="progress-div">
                    <v-chart style="width: 300px; height: 300px" :option="diskChart" autoresize />
                  </el-col>
                </el-row>
              </el-col>
              <el-col :span="12" class="progress-div">
                <div class="vnstat home-div">
                  <el-table
                    :data="vnstat[vnstatPeriod].interfaces[0].traffic[vnstatPeriod]"
                    size="mini"
                    stripe>
                    <el-table-column
                      width="200">
                      <template slot="header">
                        <el-select size="mini" v-model="period" @change="handlePeriod" placeholder="选择周期">
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
        fiveminite: {
          interfaces: [
            {
              traffic: {
                fiveminite: []
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
      period: '',
      vnstatPeriod: 'hour',
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
      chartSeries: [],
      xAxis: {},
      memoryChart: {
        textStyle: {
          fontFamily: 'consolas'
        },
        series: [
          {
            type: 'gauge',
            startAngle: 200,
            endAngle: -20,
            axisLine: {
              lineStyle: {
                width: 8,
                color: [
                  [0.3, '#67e0e3'],
                  [0.7, '#37a2da'],
                  [1, '#fd666d']
                ]
              }
            },
            pointer: {
              itemStyle: {
                color: 'auto'
              }
            },
            axisTick: {
              distance: -30,
              length: 8,
              lineStyle: {
                color: '#fff',
                width: 2
              }
            },
            splitLine: {
              distance: -30,
              length: 30,
              lineStyle: {
                color: '#fff',
                width: 4
              }
            },
            axisLabel: {
              color: 'auto',
              distance: 20,
              fontSize: 12
            },
            detail: {
              valueAnimation: true,
              formatter: '内存: {value}%',
              fontSize: 16,
              color: 'auto'
            },
            data: [
              {
                value: 0,
                title: {
                  show: true,
                  fontSize: 12
                }
              }
            ]
          }
        ]
      },
      diskChart: {
        textStyle: {
          fontFamily: 'consolas'
        },
        series: [
          {
            type: 'gauge',
            startAngle: 200,
            endAngle: -20,
            axisLine: {
              lineStyle: {
                width: 8,
                color: [
                  [0.3, '#67e0e3'],
                  [0.7, '#37a2da'],
                  [1, '#fd666d']
                ]
              }
            },
            pointer: {
              itemStyle: {
                color: 'auto'
              }
            },
            axisTick: {
              distance: -30,
              length: 8,
              lineStyle: {
                color: '#fff',
                width: 2
              }
            },
            splitLine: {
              distance: -30,
              length: 30,
              lineStyle: {
                color: '#fff',
                width: 4
              }
            },
            axisLabel: {
              color: 'auto',
              distance: 20,
              fontSize: 12
            },
            detail: {
              valueAnimation: true,
              formatter: '磁盘: {value}%',
              fontSize: 16,
              color: 'auto'
            },
            data: [
              {
                value: 0,
                title: {
                  show: true,
                  fontSize: 12
                }
              }
            ]
          }
        ]
      },
      chart: {
        title: {
          text: '流量曲线',
          left: 'center'
        },
        legend: {
          top: '7%'
        },
        textStyle: {
          fontFamily: 'consolas'
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
        legend: {
          top: '8%'
        },
        textStyle: {
          fontFamily: 'consolas'
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
      this.vnstatPeriod = vnstatPeriod;
      this.chart.xAxis.data = this.vnstat[this.vnstatPeriod].interfaces[0].traffic[this.vnstatPeriod].map(item => this.formatTime(item).slice(-5)).reverse();
      this.chart.series[0].data = this.vnstat[this.vnstatPeriod].interfaces[0].traffic[this.vnstatPeriod].map(item => item.tx).reverse();
      this.chart.series[1].data = this.vnstat[this.vnstatPeriod].interfaces[0].traffic[this.vnstatPeriod].map(item => item.rx).reverse();
    },
    async displayDetails (row) {
      this.server = row;
      await this.getVnstat();
      await this.getDiskUse();
      await this.getMemoryUse();
      this.networkChart.xAxis.data = [];
      this.networkChart.series[0].data = [];
      this.networkChart.series[1].data = [];
      const maxSizePoint = this.diskUse[this.server.id].sort((a, b) => b.size - a.size)[0];
      const memoryPoint = this.memoryUse[this.server.id];
      this.diskChart.series[0].data[0].value = (maxSizePoint.used / maxSizePoint.size * 100).toFixed(2);
      this.memoryChart.series[0].data[0].value = (memoryPoint.used / memoryPoint.total * 100).toFixed(2);
      this.diskChart.series[0].data[0].name = `${this.$formatSize(maxSizePoint.used)} / ${this.$formatSize(maxSizePoint.size)}`;
      this.memoryChart.series[0].data[0].name = `${this.$formatSize(memoryPoint.used)} / ${this.$formatSize(memoryPoint.total)}`;
      this.handlePeriod('hour');
      this.clientCollapse = ['1'];
    },
    formatTime (row) {
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
        this.vnstat[key].interfaces = this.vnstat[key].interfaces.sort((a, b) => b.total.rx - a.total.rx);
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
    gotoClient (row) {
      if (row.clientUrl) {
        window.open(row.clientUrl);
      } else {
        const url = this.clientList.filter(item => item.id === row.bindClient)[0].clientUrl;
        window.open(url);
      }
    },
    gotoTorrentList (row) {
      this.$router.push('/torrent-mix?clients=' + JSON.stringify([row.id]));
    }
  },
  async mounted () {
    await this.getNetSpeed();
    await this.getCpuUse();
    await this.getServerList();
    await this.listClient();
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
.radius-div {
  border-radius: 8px;
  background: #FFFFFF;
}

.collapse {
  margin: 20px;
}

.chart {
  height: 400px;
}
</style>
