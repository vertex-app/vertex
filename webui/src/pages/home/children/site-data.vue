<template>
  <div class="site-data">
    <div class="radius-div">
      <div class="upload">
        <v-chart class="chart" :option="upload" autoresize />
      </div>
    </div>
    <div class="radius-div">
      <div class="download">
        <v-chart class="chart" :option="download" autoresize />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      upload: {
        title: {
          text: '上传',
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
            params = params.sort((a, b) => b.value - a.value).slice(10);
            for (const param of params) {
              const size = this.$formatSize(param.value);
              const increase = this.$formatSize(this.upload.series[param.seriesIndex].data[param.dataIndex] - (this.upload.series[param.seriesIndex].data[param.dataIndex - 1] || 0));
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
            right: 10,
            top: 10,
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
      download: {
        title: {
          text: '下载',
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
            params = params.sort((a, b) => b.value - a.value).slice(10);
            for (const param of params) {
              const size = this.$formatSize(param.value);
              const increase = this.$formatSize(this.download.series[param.seriesIndex].data[param.dataIndex] - (this.download.series[param.seriesIndex].data[param.dataIndex - 1] || 0));
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
            right: 10,
            top: 10,
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
      }
    };
  },
  methods: {
    async listSite () {
      const res = await this.$axiosGet('/api/site/listRecord');
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
          opacity: 0.2
        },
        smooth: true
      };
      this.upload.series = [];
      this.download.series = [];
      const dateSet = this.siteInfo.data.timeGroup;
      for (const site of Object.keys(recordList)) {
        if (siteList.filter(item => item.name === site)[0].display === false) {
          continue;
        }
        const siteRecord = recordList[site];
        const upload = { ...template };
        upload.data = Object.keys(siteRecord).map(i => siteRecord[i].upload);
        upload.name = site;
        this.upload.series.push(upload);
        const download = { ...template };
        download.data = Object.keys(siteRecord).map(i => siteRecord[i].download);
        download.name = site;
        this.download.series.push(download);
      }
      if (this.download.series[0]) {
        const total = [];
        this.download.series[0].data.forEach((v, i) => {
          for (const series of this.download.series) {
            if (total[i]) {
              total[i] += series.data[i];
            } else {
              total[i] = series.data[i];
            }
          }
        });
        const t = { ...template };
        t.name = 'Total';
        t.data = total;
        this.download.series.push(t);
      }
      this.download.xAxis.data = dateSet.map(i => this.$moment(i * 1000).format('YYYY-MM-DD HH:mm'));
      if (this.upload.series[0]) {
        const total = [];
        this.upload.series[0].data.forEach((v, i) => {
          for (const series of this.upload.series) {
            if (total[i]) {
              total[i] += series.data[i];
            } else {
              total[i] = series.data[i];
            }
          }
        });
        const t = { ...template };
        t.name = 'Total';
        t.data = total;
        this.upload.series.push(t);
      }
      this.upload.xAxis.data = dateSet.map(i => this.$moment(i * 1000).format('YYYY-MM-DD HH:mm'));
    }
  },
  async mounted () {
    this.listSite();
  }
};
</script>

<style scoped>
.upload {
  margin: 20px;
}

.chart {
  padding: 20px 0;
  height: 600px;
}

.site-data {
  padding: 0 20px 0 0;
}
</style>
