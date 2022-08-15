<template>
  <div style="font-size: 24px; font-weight: bold;">站点数据</div>
  <a-divider></a-divider>
  <div class="site-metric" >
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :loading="loading"
      :data-source="sites"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">站点数据</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="['upload', 'download'].indexOf(column.dataIndex) !== -1">
          {{ $formatSize(record[column.dataIndex]) }}
        </template>
        <template v-if="['yesterday', 'today', 'week', 'month'].indexOf(column.dataIndex) !== -1">
          ↑ {{ $formatSize(siteIncrease[column.dataIndex][record.name].upload) }}
          <br>
          ↓ {{ $formatSize(siteIncrease[column.dataIndex][record.name].download) }}
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
        title: '站点',
        dataIndex: 'name',
        width: 48,
        fixed: true,
        sorter: (a, b) => a.name.localeCompare(b.name)
      }, {
        title: '上传',
        dataIndex: 'upload',
        width: 48,
        sorter: (a, b) => a.upload - b.upload
      }, {
        title: '下载',
        dataIndex: 'download',
        width: 48,
        sorter: (a, b) => a.download - b.download
      }, {
        title: '昨日增长',
        dataIndex: 'yesterday',
        width: 48,
        sorter: (a, b) => a.yesterday.upload - b.yesterday.upload
      }, {
        title: '今日增长',
        dataIndex: 'today',
        width: 48,
        sorter: (a, b) => a.today.upload - b.today.upload
      }, {
        title: '周增长',
        dataIndex: 'week',
        width: 48,
        sorter: (a, b) => a.week.upload - b.week.upload
      }, {
        title: '月增长',
        dataIndex: 'month',
        width: 48,
        sorter: (a, b) => a.month.upload - b.month.upload
      }
    ];
    return {
      loading: true,
      columns,
      sites: [],
      siteIncrease: {}
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
    async listSite () {
      this.loading = true;
      try {
        const res = (await this.$api().site.list()).data;
        this.sites = res.siteList;
        this.siteIncrease = res.increase;
        this.sites.push({
          name: 'total',
          upload: this.sites[0] ? this.sites.map(item => item.upload).reduce((a, b) => a + b) : 0,
          download: this.sites[0] ? this.sites.map(item => item.download).reduce((a, b) => a + b) : 0
        });
        for (const site of this.sites) {
          site.yesterday = this.siteIncrease.yesterday[site.name];
          site.today = this.siteIncrease.today[site.name];
          site.week = this.siteIncrease.week[site.name];
          site.month = this.siteIncrease.month[site.name];
        }
      } catch (e) {
        await this.$message().error(e.message);
      }
      this.loading = false;
    }
    /*
    async listRecord () {
      try {
        const res = (await this.$api().site.listRecord()).data;
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
    */
  },
  async mounted () {
    this.listSite();
    // this.listRecord();
  }
};
</script>
<style scoped>
.site-metric {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
