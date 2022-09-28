<template>
  <div class="index">
    <a-row type="flex" justify="center" align="middle" style="min-height: 100%;">
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
              <div>今日拒绝</div>
              <div>REJECT</div>
              <div style="margin: initial; font-size: 18px;">{{runInfo.rejectCountToday}}</div>
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
              <div>累计拒绝</div>
              <div>REJECT</div>
              <div style="margin: initial; font-size: 18px;">{{runInfo.rejectCount}}</div>
            </div>
          </div>
        </div>
        <!--
        <div style="margin: 24px auto; text-align: center; max-width: 1440px;">
          <div :class="`data-rect-3-${isMobile() ? 'mobile': 'pc'}`" style="background: #eff;">
          </div>
        </div>
        -->
        <div
          style="margin: 24px auto; text-align: center; max-width: 1440px;"
          v-if="runInfo.dashboardContent.filter(item => item === 'downloader')[0]"
          >
          <template v-for="(downloader, index ) in downloaders" :key="downloader.id">
            <div
              @click="gotoClient(`/proxy/client/${downloader.id}/`)"
              v-if="index === 0"
              class="data-rect-pointer data-rect-2 highlight-3"
              :style="downloaders.length === 1 ? `width: ${isMobile() ? '336px' : '688px'}` : ''">
              <!--
              <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">
                <v-chart :option="downloader.speedChart"/>
              </div>
              -->
              <div style="font-size: 14px; font-weight: bold; color: #fff; padding: 16px 16px;">
                <div>{{ downloader.alias }}</div>
                <div style="margin: initial; font-size: 12px;">累计数据: {{ $formatSize(downloader.allTimeUpload) }} ↑ / {{$formatSize(downloader.allTimeDownload)}} ↓</div>
                <div style="margin: initial; font-size: 16px;">{{ $formatSize(downloader.uploadSpeed) }}/s ↑ / {{$formatSize(downloader.downloadSpeed)}}/s ↓</div>
              </div>
            </div>
            <div
              @click="gotoClient(`/proxy/client/${downloader.id}/`)"
              v-if="index !== 0"
              class="data-rect-pointer data-rect-2"
              :style="(downloaders.length === index + 1 && downloaders.length % 2 === 1) ? `background: #eff; width: ${isMobile() ? '336px' : '688px'}` : 'background: #eff;'">
              <!--
              <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">
                <v-chart :option="downloader.speedChart"/>
              </div>
              -->
              <div style="font-size: 14px; font-weight: bold; padding: 16px 16px;">
                <div>{{ downloader.alias }}</div>
                <div style="margin: initial; font-size: 12px;">累计数据: {{ $formatSize(downloader.allTimeUpload) }} ↑ / {{$formatSize(downloader.allTimeDownload)}} ↓</div>
                <div style="margin: initial; font-size: 16px;">{{ $formatSize(downloader.uploadSpeed) }}/s ↑ / {{$formatSize(downloader.downloadSpeed)}}/s ↓</div>
              </div>
            </div>
          </template>
        </div>
        <div
          style="margin: 24px auto; text-align: center; max-width: 1440px;"
          v-if="runInfo.dashboardContent.filter(item => item === 'server')[0]"
          >
          <template v-for="(server, index ) in servers" :key="server.id">
            <div
              v-if="index === 0"
              class="data-rect-2 highlight-4"
              :style="servers.length === 1 ? `width: ${isMobile() ? '336px' : '688px'}` : ''">
              <!--
              <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">
                <v-chart :option="server.speedChart"/>
              </div>
              -->
              <div style="font-size: 14px; font-weight: bold; color: #fff; padding: 16px 16px;">
                <div>{{ server.alias }}</div>
                <div style="margin: initial; font-size: 12px;"></div>
                <div style="margin: initial; font-size: 16px;">{{ $formatSize(server.netSpeed.upload) }}/s ↑ / {{$formatSize(server.netSpeed.download)}}/s ↓</div>
              </div>
            </div>
            <div
              v-if="index !== 0"
              class="data-rect-2"
              :style="servers.length === index + 1 && servers.length % 2 === 1 ? `background: #eff; width: ${isMobile() ? '336px' : '688px'}` : 'background: #eff;'">
              <!--
              <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">
                <v-chart :option="server.speedChart" :init-options="{renderer: 'svg'}"/>
              </div>
              -->
              <div style="font-size: 14px; font-weight: bold; padding: 16px 16px;">
                <div>{{ server.alias }}</div>
                <div style="margin: initial; font-size: 12px;"></div>
                <div style="margin: initial; font-size: 16px;">{{ $formatSize(server.netSpeed.upload) }}/s ↑ / {{$formatSize(server.netSpeed.download)}}/s ↓</div>
              </div>
            </div>
          </template>
        </div>
        <div
          style="margin: 24px auto; text-align: center; max-width: 1440px;"
          v-if="runInfo.dashboardContent.filter(item => item === 'tracker')[0]"
          >
          <div :class="`data-rect-3-${isMobile() ? 'mobile': 'pc'}`" style="background: #eff; height: 400px;">
            <v-chart :option="trackerChart" autoresize/>
          </div>
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
      trackerChart: {
        title: {
          text: 'Tracker 速度',
          left: 'center',
          textStyle: {
            fontFamily: 'consolas'
          }
        },
        grid: {
          top: 20,
          left: this.isMobile() ? 0 : 90,
          right: 0,
          bottom: 90
        },
        legend: {
          show: false
        },
        textStyle: {
          fontFamily: 'consolas'
        },
        dataZoom: [
          {
            type: 'inside',
            start: 0,
            end: 100
          },
          {
            start: 0,
            end: 100
          }
        ],
        tooltip: {
          trigger: 'axis',
          position: function (pos, params, dom, rect, size) {
            const obj = { top: 60 };
            obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5;
            return obj;
          },
          formatter: (params) => {
            let str = params[0].axisValue + '</br>';
            params = params.sort((a, b) => b.value - a.value).filter(item => item.value);
            for (const param of params) {
              const size = this.$formatSize(param.value) + '/s';
              str += `${param.seriesName.slice(0, 20)}: ${'&nbsp;'.repeat(40 - size.length - param.seriesName.slice(0, 20).length || 1)}${size}<br>`;
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
            show: !this.isMobile(),
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
      speedChart: {
        grid: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          z: 0
        },
        xAxis: {
          type: 'category',
          show: false,
          boundaryGap: false,
          data: []
        },
        yAxis: {
          type: 'value',
          show: false
        },
        series: [
          {
            data: [],
            type: 'line',
            symbol: 'none',
            smooth: true,
            areaStyle: {
              opacity: 0.2,
              color: '#BEC23F'
            },
            lineStyle: {
              opacity: 0,
              color: '#BEC23F'
            }
          }, {
            data: [],
            type: 'line',
            symbol: 'none',
            smooth: true,
            areaStyle: {
              opacity: 0,
              color: '#C46243'
            },
            lineStyle: {
              opacity: 0,
              color: '#C46243'
            }
          }
        ]
      },
      runInfo: {
        dashboardContent: []
      },
      trackerInfo: {},
      servers: [],
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
        for (const error of this.runInfo.errors.reverse()) {
          await this.$notification().error({
            message: '存在错误信息, 请检查日志',
            description: error.map(item => {
              if (typeof item === 'object') {
                return item.message || item.code || item.description;
              }
              return item;
            }).join(', '),
            duration: 0
          });
        }
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async listDownloader () {
      try {
        const res = await this.$api().downloader.listMainInfo();
        this.downloaders = res.data
          .sort((a, b) => a.alias.localeCompare(b.alias))
          .map(item => ({
            ...item,
            speedChart: JSON.parse(JSON.stringify(this.speedChart))
          }));
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async listDownloaderInfo () {
      try {
        const res = await this.$api().downloader.listMainInfo();
        for (const downloader of this.downloaders) {
          const upload = res.data.filter(item => item.id === downloader.id)[0]?.uploadSpeed || 0;
          const download = res.data.filter(item => item.id === downloader.id)[0]?.downloadSpeed || 0;
          downloader.uploadSpeed = upload;
          downloader.downloadSpeed = download;
          // downloader.speedChart.xAxis.data.push('');
          // downloader.speedChart.series[0].data.push(upload);
          // downloader.speedChart.series[1].data.push(download);
        }
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async listServer () {
      try {
        const res = await this.$api().server.list();
        this.servers = res.data
          .sort((a, b) => a.alias.localeCompare(b.alias))
          .map(item => (
            {
              ...item,
              netSpeed: {
                upload: 0,
                download: 0
              },
              speedChart: JSON.parse(JSON.stringify(this.speedChart))
            }));
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async getNetSpeed () {
      try {
        this.netSpeed = (await this.$api().server.netSpeed()).data;
        for (const server of this.servers) {
          const upload = this.netSpeed[server.id]?.sort((a, b) => b.txBytes - a.txBytes)[0].txBytes || 0;
          const download = this.netSpeed[server.id]?.sort((a, b) => b.txBytes - a.txBytes)[0].rxBytes || 0;
          server.netSpeed = {
            upload,
            download
          };
          server.speedChart.xAxis.data.push('');
          server.speedChart.series[0].data.push(upload);
          // server.speedChart.series[1].data.push(download);
        }
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
        sampling: 'lttb',
        areaStyle: {
          opacity: 0.2
        },
        lineStyle: {
          opacity: 0.7
        },
        smooth: true
      };
      this.trackerChart.series = [];
      const dateSet = this.trackerInfo.data.timeGroup;
      for (const _tracker of Object.keys(recordList)) {
        const trackerRecord = recordList[_tracker];
        const tracker = { ...template };
        tracker.data = Object.keys(trackerRecord).map(i => Math.max(trackerRecord[i].upload, 0));
        tracker.name = _tracker;
        this.trackerChart.series.push(tracker);
      }
      if (this.trackerChart.series[0]) {
        const total = [];
        for (const [i] of this.trackerChart.series[0].data.entries()) {
          for (const series of this.trackerChart.series) {
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
        this.trackerChart.series.push(t);
      }
      this.trackerChart.xAxis.data = dateSet.map(i => this.$moment(i * 1000).format('YYYY-MM-DD HH:mm'));
    },
    async gotoClient (url) {
      window.open(url);
    }
  },
  async mounted () {
    await this.getRunInfo();
    const downloader = !!this.runInfo.dashboardContent.filter(item => item === 'downloader')[0];
    const server = !!this.runInfo.dashboardContent.filter(item => item === 'server')[0];
    const tracker = !!this.runInfo.dashboardContent.filter(item => item === 'tracker')[0];
    if (downloader) {
      this.listDownloader();
      this.listDownloaderInfo();
    }
    if (server) {
      this.listServer();
      this.getNetSpeed();
    }
    if (tracker) {
      this.listTrackerHistory();
    }
    this.interval = setInterval(() => {
      if (downloader) {
        this.listDownloaderInfo();
      }
      if (server) {
        this.getNetSpeed();
      }
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

.highlight-4 {
  background: #00896C;
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
  margin: 8px;
  border-radius: 8px;
}

.data-rect-2 {
  text-align: left;
  vertical-align: top;
  width: 336px;
  height: 104px;
  transition: all 0.5s;
  color: #555;
  position: relative;
  display: inline-block;
  margin: 8px;
  border-radius: 8px;
}

.data-rect-3-pc {
  text-align: left;
  vertical-align: top;
  width: 688px;
  height: 104px;
  transition: all 0.5s;
  padding: 16px 16px;
  color: #555;
  display: inline-block;
  margin: 8px;
  border-radius: 8px;
}

.data-rect-3-mobile {
  text-align: left;
  vertical-align: top;
  width: 336px;
  height: 104px;
  transition: all 0.5s;
  padding: 16px 16px;
  color: #555;
  display: inline-block;
  margin: 8px;
  border-radius: 8px;
}

.data-rect-pointer {
  cursor: pointer;
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
