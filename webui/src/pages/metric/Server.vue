<template>
  <div style="font-size: 24px; font-weight: bold;">服务器数据</div>
  <a-divider></a-divider>
  <div class="server-metric" >
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :loading="loading"
      :data-source="servers"
      :scroll="{ x: 56 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">服务器数据</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'alias'">
          <a @click="expandVnstat(record)">{{ record.alias }}</a>
        </template>
        <template v-if="column.dataIndex === 'netSpeed'">
          {{ $formatSize(record.netSpeed?.upload || 0) }}/s / {{ $formatSize(record.netSpeed?.download || 0) }}/s
        </template>
        <template v-if="column.dataIndex === 'cpuUse'">
          {{ (record.cpuUse || 0).toFixed(2) }}%
        </template>
      </template>
    </a-table>
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="vnstatColumns"
      size="small"
      :pagination="false"
      v-if="vnstatData[period]"
      :data-source="vnstatData[period]"
      :scroll="{ x: 88 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">历史数据统计</span>
      </template>
      <template #headerCell="{ column }">
        <template v-if="column.dataIndex === 'date'">
          <a-select size="small" v-model:value="period" style="width: 100%; " >
            <a-select-option value="hour">时</a-select-option>
            <a-select-option value="day">日</a-select-option>
            <a-select-option value="month">月</a-select-option>
            <a-select-option value="fiveminute">五分钟</a-select-option>
          </a-select>
        </template>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'date'">
          {{ formatTime(record) }}
        </template>
        <template v-if="column.dataIndex === 'tx'">
          {{ $formatSize(record.tx || 0) }}
        </template>
        <template v-if="column.dataIndex === 'rx'">
          {{ $formatSize(record.rx || 0) }}
        </template>
      </template>
    </a-table>
  </div>
</template>
<script>
export default {
  data () {
    const columns = [
      {
        title: '服务器',
        dataIndex: 'alias',
        defaultSortOrder: 'ascend',
        width: 12,
        fixed: true,
        sorter: (a, b) => a.alias.localeCompare(b.alias)
      }, {
        title: 'CPU 占用',
        dataIndex: 'cpuUse',
        sorter: (a, b) => a.cpuUse - b.cpuUse,
        width: 12
      }, {
        title: '实时上传/下载',
        dataIndex: 'netSpeed',
        sorter: (a, b) => a.netSpeed.upload - b.netSpeed.upload,
        width: 32
      }
    ];
    const vnstatColumns = [
      {
        title: '日期',
        dataIndex: 'date',
        width: 24,
        fixed: true
      }, {
        title: '上传',
        dataIndex: 'tx',
        width: 32
      }, {
        title: '下载',
        dataIndex: 'rx',
        width: 32
      }
    ];
    return {
      loading: true,
      columns,
      vnstatColumns,
      servers: [],
      period: 'day',
      vnstatData: {},
      netSpeed: {},
      cpuUse: {}
    };
  },
  methods: {
    isMobile () {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
      } else {
        return false;
      }
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
    async listServer () {
      this.loading = true;
      try {
        this.servers = (await this.$api().server.list()).data;
      } catch (e) {
        await this.$message().error(e.message);
      }
      this.loading = false;
    },
    async getNetSpeed () {
      try {
        this.netSpeed = (await this.$api().server.netSpeed()).data;
        for (const server of this.servers) {
          server.netSpeed = {
            upload: this.netSpeed[server.id]?.sort((a, b) => b.txBytes - a.txBytes)[0].txBytes || 0,
            download: this.netSpeed[server.id]?.sort((a, b) => b.txBytes - a.txBytes)[0].rxBytes || 0
          };
        }
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async getCpuUse () {
      try {
        this.cpuUse = (await this.$api().server.cpuUse()).data;
        for (const server of this.servers) {
          server.cpuUse = 100 - this.cpuUse[server.id]?.all.idle || 0;
        }
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async expandVnstat (record) {
      try {
        this.period = 'day';
        this.vnstat = (await this.$api().server.vnstat(record.id)).data;
      } catch (e) {
        await this.$message().error(e.message);
        return;
      }
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
      this.vnstatData = {
        day: this.vnstat.day.interfaces[0].traffic.day,
        month: this.vnstat.month.interfaces[0].traffic.month,
        fiveminute: this.vnstat.fiveminute.interfaces[0].traffic.fiveminute,
        hour: this.vnstat.hour.interfaces[0].traffic.hour
      };
    }
  },
  async mounted () {
    this.listServer();
    this.getNetSpeed();
    this.getCpuUse();
    this.interval = setInterval(() => {
      this.getNetSpeed();
      this.getCpuUse();
    }, 5000);
  },
  beforeUnmount () {
    clearInterval(this.interval);
  }
};
</script>
<style scoped>
.server-metric {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
