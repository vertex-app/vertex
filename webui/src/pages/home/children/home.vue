<template>
  <div class="home">
    <div class="network home-div">
      <el-table
        :data="serverList"
        stripe
        style="width: 100%">
        <el-table-column
          prop="id"
          label="ID"
          width="180">
        </el-table-column>
        <el-table-column
          prop="alias"
          label="别名"
          width="180">
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
        <el-table-column>
          <template slot="header" slot-scope="scope">
            <el-switch
              v-model="usernameDisplay">
            </el-switch>
            用户名
          </template>
          <template slot-scope="scope">
            {{ usernameDisplay ? scope.row.username : '**********' }}
          </template>
        </el-table-column>
        <el-table-column
          label="CPU">
          <template slot-scope="scope">
            {{cpuUse[scope.row.id] ? (100 - cpuUse[scope.row.id].all.idle).toFixed(2) + '%' : null}}
          </template>
        </el-table-column>
        <el-table-column
          label="Memory">
          <template slot-scope="scope">
            {{memoryUse[scope.row.id] ? $formatSize(memoryUse[scope.row.id].used) + '/' + $formatSize(memoryUse[scope.row.id].total) : null}}
          </template>
        </el-table-column>
        <el-table-column
          label="Disk">
          <template slot-scope="scope">
            {{diskUse[scope.row.id] ? $formatSize(diskUse[scope.row.id][0].used) + '/' + $formatSize(diskUse[scope.row.id][0].size) : null}}
          </template>
        </el-table-column>
        <el-table-column
          label="↑/↓">
          <template slot-scope="scope">
            {{netSpeed[scope.row.id] ? $formatSize(netSpeed[scope.row.id][0].txBytes) + '/s / ' + $formatSize(netSpeed[scope.row.id][0].rxBytes) + '/s' : null}}
          </template>
        </el-table-column>
        <el-table-column
          label="启用"
          width="100">
          <template slot-scope="scope">
            <el-tag>{{scope.row.enable}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status ? '' : 'danger'">{{scope.row.status ? '正常' : '连接失败'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作">
          <template slot-scope="scope">
            <el-button :disabled="!scope.row.status" @click="displayDetails(scope.row)" type="primary" size="small">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="collapse-div">
      <el-collapse  class="collapse" v-model="clientCollapse">
        <el-collapse-item :title="`${server.alias || ''} 详情`" name="1">
          <div class="server-status home-div">
            <v-chart class="chart" :option="chart" autoresize />
            <el-row
              class="row"
              type="flex"
              justify="space-between"
              align="top">
              <el-col :span="11" class="progress-div">
                <div class="vnstat home-div">
                  <el-table
                    :data="vnstat[vnstatPeriod].interfaces[0].traffic[vnstatPeriod]"
                    stripe>
                    <el-table-column
                      width="200">
                      <template slot="header">
                        <el-dropdown
                          size="mini"
                          split-button type="primary"
                          @command="handlePeriod">
                          选择周期
                          <el-dropdown-menu slot="dropdown">
                            <el-dropdown-item command="fiveminute">5 分钟</el-dropdown-item>
                            <el-dropdown-item command="hour">时</el-dropdown-item>
                            <el-dropdown-item command="day">日</el-dropdown-item>
                            <el-dropdown-item command="month">月</el-dropdown-item>
                          </el-dropdown-menu>
                        </el-dropdown>
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
              <el-col :span="11" class="progress-div">
                <p>cpu</p>
                <div class="progress" v-for="key of Object.keys(cpuUse[server.id] || {})" :key="key">
                  <el-progress
                    :percentage="parseInt(100 - (cpuUse[server.id][key] || { idle: 100 }).idle)"
                    :color="customColors"
                    :format="i => 'CPU ' + key + ' ' + i + '%'">
                  </el-progress>
                </div>
                <el-divider></el-divider>
                <p>Memory</p>
                <div v-if="server.id" class="progress">
                  <el-progress
                    :percentage="parseInt((memoryUse[server.id] || { used: 0 }).used / (memoryUse[server.id] || { total: 1 }).total * 100)"
                    :color="customColors"
                    :format="i => `${$formatSize((memoryUse[server.id] || {}).used)}/${$formatSize((memoryUse[server.id] || {}).total)}, ${i}%`">
                  </el-progress>
                </div>
                <el-divider></el-divider>
                <p>Disk</p>
                <div class="progress">
                  <el-progress
                    v-for="disk of diskUse[server.id]"
                    :key="disk.mountPoint"
                    :percentage="parseInt(disk.used / disk.size * 100)"
                    :color="customColors"
                    :format="i => `${disk.mountPoint}, ${$formatSize(disk.used)}/${$formatSize(disk.size)}, ${i}%`">
                  </el-progress>
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
      vnstatPeriod: 'day',
      usernameDisplay: true,
      hostDisplay: true,
      customColors: [
        { color: '#90EE90', percentage: 20 },
        { color: '#48D1CC', percentage: 40 },
        { color: '#00BFFF', percentage: 60 },
        { color: '#DC143C', percentage: 80 },
        { color: '#FF00FF', percentage: 100 }
      ],
      chartSeries: [],
      xAxis: {},
      chart: {
        title: {
          text: 'Network Traffic',
          left: 'center'
        },
        darkMode: true,
        tooltip: {
          trigger: 'axis'
        },
        visualMap: {
          type: 'piecewise',
          showLabel: false,
          top: 10,
          right: 10,
          splitNumber: 7,
          inRange: {
            color: ['#01DF01', '#01DF74', '#01DFD7', '#0174DF', '#0101DF', '#7401DF', '#DF01A5']
          },
          outRange: {
            color: ['#313695']
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
            name: 'Tx',
            type: 'line',
            data: [],
            itemStyle: {
              borderRadius: [4, 4, 0, 0]
            },
            smooth: true
          }, {
            name: 'Rx',
            type: 'line',
            data: [],
            itemStyle: {
              borderRadius: [4, 4, 0, 0]
            },
            smooth: true
          }, {
            name: 'Rx',
            type: 'bar',
            data: [],
            itemStyle: {
              borderRadius: [4, 4, 0, 0]
            },
            smooth: true
          }, {
            name: 'Rx',
            type: 'bar',
            data: [],
            itemStyle: {
              borderRadius: [4, 4, 0, 0]
            },
            smooth: true
          }
        ]
      }
    };
  },
  methods: {
    handlePeriod (period) {
      this.vnstatPeriod = period;
      this.chart.xAxis.data = this.vnstat[this.vnstatPeriod].interfaces[0].traffic[this.vnstatPeriod].map(item => this.formatTime(item).slice(-5)).reverse();
      this.chart.series[0].data = this.vnstat[this.vnstatPeriod].interfaces[0].traffic[this.vnstatPeriod].map(item => item.tx).reverse();
      this.chart.series[1].data = this.vnstat[this.vnstatPeriod].interfaces[0].traffic[this.vnstatPeriod].map(item => item.rx).reverse();
      this.chart.visualMap.min = 0;
      this.chart.visualMap.max = Math.max(...this.chart.series[0].data.concat(this.chart.series[1].data));
    },
    async displayDetails (row) {
      this.server = row;
      await this.getVnstat();
      this.handlePeriod('day');
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
    },
    async getMemoryUse () {
      const res = await this.$axiosGet('/api/server/memoryUse?_=' + Math.random());
      if (!res) {
        return;
      }
      this.memoryUse = res.data;
    }
  },
  async mounted () {
    await this.getNetSpeed();
    await this.getCpuUse();
    await this.getDiskUse();
    await this.getMemoryUse();
    await this.getServerList();
    this.freshData = setInterval(() => {
      this.getNetSpeed();
      this.getCpuUse();
      this.getMemoryUse();
      this.getDiskUse();
    }, 5000);
  },
  beforeDestroy () {
    clearInterval(this.freshData);
  }
};
</script>

<style scoped>
.home-div {
  margin: 20px 0;
}

.progress {
  margin: 10px 0;
}

.progress-div {
  padding: 6px 0px;
  border-radius: 8px;
  background: #FFFFFF;
}

.collapse-div {
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
