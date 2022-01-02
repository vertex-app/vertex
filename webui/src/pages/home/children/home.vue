<template>
  <div class="home">
    <div class="network home-div">
      <el-table
        :data="netSpeed"
        stripe
        style="width: 100%">
        <el-table-column
          prop="interface"
          label="接口"
          width="180">
        </el-table-column>
        <el-table-column
          prop="txBytes"
          label="↑">
        </el-table-column>
        <el-table-column
          prop="rxBytes"
          label="↓">
        </el-table-column>
        <el-table-column
          prop="txPackets"
          label="↑ packets">
        </el-table-column>
        <el-table-column
          prop="rxPackets"
          label="↓ packets">
        </el-table-column>
      </el-table>
    </div>
    <div class="server-status home-div">
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
          <div class="progress" v-for="key of Object.keys(cpuUse)" :key="key">
            <el-progress
              :percentage="parseInt((cpuUse[key].total - cpuUse[key].idle) / cpuUse[key].total * 100)"
              :color="customColors"
              :format="i => key + ' ' + i + '%'">
            </el-progress>
          </div>
          <el-divider></el-divider>
          <p>Memory</p>
          <div class="progress">
            <el-progress
              :percentage="parseInt(memoryUse.used / memoryUse.total * 100)"
              :color="customColors"
              :format="i => `${$formatSize(memoryUse.used * 1024)}/${$formatSize(memoryUse.total * 1024)}, ${i}%`">
            </el-progress>
          </div>
          <el-divider></el-divider>
          <p>Disk</p>
          <div class="progress" v-for="key of Object.keys(diskUse)" :key="key">
            <el-progress
              :percentage="parseInt(diskUse[key].used / diskUse[key].size * 100)"
              :color="customColors"
              :format="i => `${key}, ${$formatSize(diskUse[key].used * 1024)}/${$formatSize(diskUse[key].size * 1024)}, ${i}%`">
            </el-progress>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      netSpeed: [],
      cpuUse: [],
      diskUse: [],
      memoryUse: {
        used: 0,
        total: 1
      },
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
      customColors: [
        { color: '#90EE90', percentage: 20 },
        { color: '#48D1CC', percentage: 40 },
        { color: '#00BFFF', percentage: 60 },
        { color: '#DC143C', percentage: 80 },
        { color: '#FF00FF', percentage: 100 }
      ]
    };
  },
  methods: {
    handlePeriod (period) {
      console.log(period);
      this.vnstatPeriod = period;
    },
    formatTime (row) {
      return `${row.date.year}-${row.date.month}` + (row.date.day ? `-${row.date.day}` : '') +
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
      const res = await this.$axiosGet('/api/server/netSpeed');
      if (!res) {
        return;
      }
      const netSpeed = [];
      for (const key of Object.keys(res.data)) {
        netSpeed.push({
          interface: key,
          rxBytes: this.$formatSize(res.data[key].rxBytes),
          txBytes: this.$formatSize(res.data[key].txBytes),
          rxPackets: res.data[key].rxPackets,
          txPackets: res.data[key].txPackets
        });
        this.netSpeed = netSpeed;
      }
    },
    async getCpuUse () {
      const res = await this.$axiosGet('/api/server/cpuUse');
      if (!res) {
        return;
      }
      this.cpuUse = res.data;
    },
    async getDiskUse () {
      const res = await this.$axiosGet('/api/server/diskUse');
      if (!res) {
        return;
      }
      this.diskUse = res.data;
    },
    async getVnstat () {
      const res = await this.$axiosGet('/api/server/vnstat');
      if (!res) {
        return;
      }
      this.vnstat = res.data;
    },
    async getMemoryUse () {
      const res = await this.$axiosGet('/api/server/memoryUse');
      if (!res) {
        return;
      }
      this.memoryUse = res.data;
    }
  },
  async mounted () {
    this.getNetSpeed();
    this.getCpuUse();
    this.getDiskUse();
    this.getVnstat();
    setInterval(() => {
      this.getNetSpeed();
      this.getCpuUse();
      this.getMemoryUse();
    }, 5000);
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
</style>
