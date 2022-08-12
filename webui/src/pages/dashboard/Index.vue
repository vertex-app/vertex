<template>
  <div class="index">
    <a-row type="flex" justify="center" align="middle" style="height: 100%;">
      <a-col :span="isMobile() ? 24 : 24">
        <div style="margin: 24px auto; text-align: center; max-width: 1440px;">
          <div class="data-rect-1 highlight-1">
            <div style="font-size: 14px; font-weight: bold; color: #e0f0e9;">
              <div>今日上传</div>
              <div>UPLOAD</div>
              <div style="margin: initial; font-size: 18px;">{{$formatSize(runInfo.uploadedToday)}}</div>
            </div>
          </div>
          <div class="data-rect-1" style="background: #eff;">
            <div style="font-size: 14px; font-weight: bold;">
              <div>今日下载</div>
              <div>DOWNLOAD</div>
              <div style="margin: initial; font-size: 18px;">{{$formatSize(runInfo.downloadedToday)}}</div>
            </div>
          </div>
          <div class="data-rect-1" style="background: #eff;">
            <div style="font-size: 14px; font-weight: bold;">
              <div>今日添加</div>
              <div>ACCEPT</div>
              <div style="margin: initial; font-size: 18px;">{{runInfo.addCountToday}}</div>
            </div>
          </div>
          <div class="data-rect-1" style="background: #eff;">
            <div style="font-size: 14px; font-weight: bold;">
              <div>今日删除</div>
              <div>REJECT</div>
              <div style="margin: initial; font-size: 18px;">{{runInfo.deleteCountToday}}</div>
            </div>
          </div>
        </div>
        <div style="margin: 24px auto; text-align: center; max-width: 1440px;">
          <div class="data-rect-1 highlight-2">
            <div style="font-size: 14px; font-weight: bold;">
              <div>累计上传</div>
              <div>UPLOAD</div>
              <div style="margin: initial; font-size: 18px;">{{$formatSize(runInfo.uploaded)}}</div>
            </div>
          </div>
          <div class="data-rect-1" style="background: #eff;">
            <div style="font-size: 14px; font-weight: bold;">
              <div>累计下载</div>
              <div>DOWNLOAD</div>
              <div style="margin: initial; font-size: 18px;">{{$formatSize(runInfo.downloaded)}}</div>
            </div>
          </div>
          <div class="data-rect-1" style="background: #eff;">
            <div style="font-size: 14px; font-weight: bold;">
              <div>累计添加</div>
              <div>ACCEPT</div>
              <div style="margin: initial; font-size: 18px;">{{runInfo.addCount}}</div>
            </div>
          </div>
          <div class="data-rect-1" style="background: #eff;">
            <div style="font-size: 14px; font-weight: bold;">
              <div>累计删除</div>
              <div>REJECT</div>
              <div style="margin: initial; font-size: 18px;">{{runInfo.deleteCount}}</div>
            </div>
          </div>
        </div>
        <div style="margin: 24px auto; text-align: center; max-width: 1440px;">
          <template v-for="(downloader, index ) in downloaders" :key="downloader.id">
            <div v-if="index === 0" class="data-rect-2 highlight-3">
              <div style="font-size: 14px; font-weight: bold; color: #fff;">
                <div>{{ downloader.alias }}</div>
                <div style="margin: initial; font-size: 12px;">累计数据: {{ $formatSize(downloader.allTimeUpload) }} ↑ / {{$formatSize(downloader.allTimeDownload)}} ↓</div>
                <div style="margin: initial; font-size: 20px;">{{ $formatSize(downloader.uploadSpeed) }} ↑ / {{$formatSize(downloader.downloadSpeed)}} ↓</div>
              </div>
            </div>
            <div v-if="index !== 0" class="data-rect-2" style="background: #eff;">
              <div style="font-size: 14px; font-weight: bold;">
                <div>{{ downloader.alias }}</div>
                <div style="margin: initial; font-size: 12px;">累计数据: {{ $formatSize(downloader.allTimeUpload) }} ↑ / {{$formatSize(downloader.allTimeDownload)}} ↓</div>
                <div style="margin: initial; font-size: 20px;">{{ $formatSize(downloader.uploadSpeed) }} ↑ / {{$formatSize(downloader.downloadSpeed)}} ↓</div>
              </div>
            </div>
          </template>
        </div>
      </a-col>
      <!--
      <a-col :span="isMobile() ? 24 : 6">
        <div style="margin: 24px auto; width: fit-content; text-align: center;">
          <div style="background: #fff; width: 344px; height: 200px;">
            <v-chart :option="torrents" class="torrent-chart" style="height: 200px;" autoresize></v-chart>
          </div>
        </div>
        <div style="margin: 24px auto; width: fit-content; text-align: center;">
          <div style="background: #fff; width: 344px; height: 344px;">
            <v-chart :option="torrents" class="torrent-chart" autoresize></v-chart>
          </div>
        </div>
        <div style="margin: 24px auto; width: fit-content; text-align: center;">
          <div style="background: #fff; width: 240px; height: 240px;">
            <v-chart :option="trackerFlow" class="torrent-chart" style="height: 240px;" autoresize></v-chart>
          </div>
        </div>
      </a-col>
      -->
    </a-row>
  </div>
</template>
<script>
export default {
  data () {
    return {
      trackerFlow: {
        tooltip: {
          trigger: 'item'
        },
        legend: this.isMobile()
          ? { show: false, type: 'scroll' }
          : {
            top: 0,
            type: 'scroll',
            left: 'center'
          },
        grid: {
          bottom: '5%'
        },
        series: [
          {
            name: 'Access From',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '40',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: 1048, name: 'A' },
              { value: 735, name: 'B' },
              { value: 580, name: 'C' },
              { value: 484, name: 'D' },
              { value: 300, name: 'E' }
            ]
          }
        ]
      },
      torrents: {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            // Use axis to trigger tooltip
            type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
          }
        },
        legend: {},
        grid: {
          left: 0,
          right: 0,
          bottom: 0,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '添加',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: [220, 182, 191, 234, 290, 330, 310]
          },
          {
            name: '删除',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: [150, 212, 201, 154, 190, 330, 410]
          }
        ]
      },
      tracker: {
        title: {
          text: 'Tracker 速度',
          left: 'center',
          textStyle: {
            fontFamily: 'LXGW WenKai Screen',
            color: '#555'
          }
        },
        grid: {
          top: 120,
          left: 90,
          right: 20,
          bottom: 40
        },
        legend: this.isMobile()
          ? {
            type: 'scroll',
            top: 72
          }
          : {
            type: 'scroll',
            top: 64,
            left: '10%',
            width: '80%',
            textStyle: {
              fontFamily: 'consolas',
              color: '#555'
            }
          },
        textStyle: {
          fontFamily: 'consolas',
          color: '#555'
        },
        darkMode: true,
        tooltip: {
          position: function (pos, params, dom, rect, size) {
            const obj = { top: 60 };
            obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5;
            return obj;
          },
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
              image: '/assets/images/logo.svg',
              width: 64,
              height: 64,
              opacity: 0.8
            }
          }
        ],
        series: []
      },
      runInfo: {},
      downloaders: [],
      loading: true
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
    async listTrackerHistory () {
      try {
        const res = await this.$api().setting.getTrackerFlowHistory();
        this.trackerInfo = res;
        this.loadTracker();
      } catch (e) {
        await this.$message().error(e.message);
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
    async listDownloaderInfo () {
      try {
        const res = await this.$api().downloader.listMainInfo();
        this.downloaders = res.data.sort((a, b) => a.alias.localeCompare(b.alias));
      } catch (e) {
        await this.$message().error(e.message);
      }
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
        tracker.data = Object.keys(trackerRecord).map(i => Math.max(trackerRecord[i].upload, 0));
        tracker.name = _tracker;
        this.tracker.series.push(tracker);
      }
      if (this.tracker.series[0]) {
        const total = [];
        for (const [i] of this.tracker.series[0].data.entries()) {
          for (const series of this.tracker.series) {
            if (total[i]) {
              total[i] += Math.max(series.data[i], 0);
            } else {
              total[i] = Math.max(series.data[i], 0);
            }
          }
        }
        const t = { ...template };
        t.name = 'Total';
        t.data = total;
        this.tracker.series.push(t);
      }
      this.tracker.xAxis.data = dateSet.map(i => this.$moment(i * 1000).format('YYYY-MM-DD HH:mm'));
    }
  },
  async mounted () {
    this.getRunInfo();
    this.listDownloaderInfo();
    this.interval = setInterval(() => {
      this.getRunInfo();
      this.listDownloaderInfo();
    }, 3000);
  },
  beforeUnmount () {
    clearInterval(this.interval);
  }
};
</script>
<style scoped>
.index {
  width: min(calc(100vw - 40px), 960px);
  margin: 0 auto;
  height: 100%;
}

.highlight-1 {
  background: #4b5cc4;
}

.highlight-2 {
  background: lightpink;
}

.highlight-3 {
  background: #3A8FB7;
}

.data-rect-1 {
  text-align: left;
  vertical-align: top;
  width: 160px;
  height: 104px;
  transition: all 0.5s;
  padding: 16px 16px;
  color: #555;
  display: inline-block;
  margin: 8px 12px;
  border-radius: 8px;
}

.data-rect-2 {
  text-align: left;
  vertical-align: top;
  width: 348px;
  height: 104px;
  transition: all 0.5s;
  padding: 16px 16px;
  color: #555;
  display: inline-block;
  margin: 8px 12px;
  border-radius: 8px;
}

.tracker-chart {
  height: 400px;
  color: #000
}

.torrent-chart {
  height: 320px;
  color: #000
}

</style>
