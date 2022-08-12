<template>
  <div style="font-size: 24px; font-weight: bold;">下载器数据</div>
  <a-divider></a-divider>
  <div class="downloader-metric" >
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :loading="loading"
      :data-source="downloaders"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">下载器数据</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="['uploadSpeed', 'downloadSpeed'].indexOf(column.dataIndex) !== -1">
          {{ $formatSize(record[column.dataIndex]) }}
        </template>
        <template v-if="column.dataIndex === 'seedingCount'">
          {{ record.seedingCount + ' / ' + record.leechingCount }}
        </template>
        <template v-if="column.dataIndex === 'allTimeUpload'">
            {{ $formatSize(record.allTimeUpload) }} / {{ $formatSize(record.allTimeDownload) }}
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="trackerColumns"
      size="small"
      :loading="loading"
      :data-source="runInfo.perTrackerToday.filter(item => item.tracker)"
      :scroll="{ x: 320 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">今日数据</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="['uploaded', 'downloaded'].indexOf(column.dataIndex) !== -1">
          {{ $formatSize(record[column.dataIndex]) }}
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="trackerColumns"
      size="small"
      :loading="loading"
      :data-source="runInfo.perTracker.filter(item => item.tracker)"
      :scroll="{ x: 320 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">累计统计</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="['uploaded', 'downloaded'].indexOf(column.dataIndex) !== -1">
          {{ $formatSize(record[column.dataIndex]) }}
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
        title: '别名',
        dataIndex: 'alias',
        width: 32,
        fixed: true,
        sorter: (a, b) => a.name.localeCompare(b.name)
      }, {
        title: '实时上传',
        dataIndex: 'uploadSpeed',
        width: 48,
        sorter: (a, b) => a.uploadSpeed - b.uploadSpeed
      }, {
        title: '实时下载',
        dataIndex: 'downloadSpeed',
        width: 48,
        sorter: (a, b) => a.downloadSpeed - b.downloadSpeed
      }, {
        title: '当前任务',
        dataIndex: 'seedingCount',
        width: 48,
        sorter: (a, b) => a.seedingCount - b.seedingCount
      }, {
        title: '累计数据',
        dataIndex: 'allTimeUpload',
        width: 64,
        sorter: (a, b) => a.allTimeUpload - b.allTimeUpload
      }
    ];
    const trackerColumns = [
      {
        title: 'tracker',
        dataIndex: 'tracker',
        width: 140,
        fixed: true,
        sorter: (a, b) => a.tracker.localeCompare(b.tracker)
      }, {
        title: '上传',
        dataIndex: 'uploaded',
        width: 90,
        sorter: (a, b) => a.uploaded - b.uploaded
      }, {
        title: '下载',
        dataIndex: 'downloaded',
        width: 90,
        sorter: (a, b) => a.downloaded - b.downloaded
      }
    ];
    return {
      loading: true,
      trackerColumns,
      columns,
      downloaders: [],
      runInfo: {
        perTracker: [],
        perTrackerToday: []
      }
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
    async getRunInfo () {
      try {
        const res = await this.$api().setting.getRunInfo();
        this.runInfo = res.data;
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async listDownloader () {
      try {
        const res = (await this.$api().downloader.listMainInfo()).data;
        this.downloaders = res;
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    this.listDownloader();
    this.getRunInfo();
    this.interval = setInterval(() => {
      this.listDownloader();
    }, 5000);
  },
  beforeUnmount () {
    clearInterval(this.interval);
  }
};
</script>
<style scoped>
.downloader-metric {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
