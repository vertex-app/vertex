<template>
  <div style="font-size: 24px; font-weight: bold;">
    站点数据
    <a-radio-group v-model:value="siteSetting.theme" @change="handleRatioChange" name="theme">
      <a-radio value="card">卡片</a-radio>
      <a-radio value="list">列表</a-radio>
      <a-radio value="overview">总览</a-radio>
    </a-radio-group>
  </div>
  <a-divider></a-divider>
  <div class="site-metric" style="text-align: center;" v-if="siteSetting.theme === 'card'">
    <div
      v-for="site of sites"
      :key="site.name"
      :style="`display: inline-block; text-align: left; width: ${isMobile() ? 'calc(100% - 24px)' : '400px'}; vertical-align: top; margin: 16px;`">
      <div :class="(site.name === 'total' ? 'highlight-3 ' : 'highlight-2 ') + (isMobile() ? 'item-class-mobile' : 'item-class-pc')">
        <div class="site-name">
          <img :src="site.icon || `/assets/icons/${site.name}.ico`" style="width: 40px; height: 40px; border-radius: 20px; background: rgba(255,255,255,0.6);" />
          <a-divider type="vertical" />
          <span style="">{{ site.name }}</span>
        </div>
        <div class="site-user" v-if="site.name !== '总计'">
          <span style="">{{ site.username }}</span>
          <br>
          <span style="">{{ site.uid }}</span>
        </div>
        <div class="site-data">
          <span style="font-weight: bold; color: green;"><fa style="width: 16px;" :icon="['fas', 'arrow-up']"></fa></span>
          <span style=""> 上传</span>
          <a-divider type="vertical" />
          <span style="">{{ $formatSize(site.upload) }}</span>
          <br>
          <span style="font-weight: bold; color: red;"><fa style="width: 16px;" :icon="['fas', 'arrow-down']"></fa></span>
          <span style=""> 下载</span>
          <a-divider type="vertical" />
          <span style="">{{ $formatSize(site.download) }}</span>
          <br>
          <span style="font-weight: bold; color: green;"><fa style="width: 16px;" :icon="['fas', 'network-wired']"></fa></span>
          <span style=""> 连接</span>
          <a-divider type="vertical" />
          <span style="">{{ site.seeding }} / {{ site.leeching }}</span>
          <br>
          <span style="font-weight: bold; color: green;"><fa style="width: 16px;" :icon="['fas', 'hard-drive']"></fa></span>
          <span style=""> 做种</span>
          <a-divider type="vertical" />
          <span style="">{{ $formatSize(site.seedingSize) }}</span>
        </div>
        <div class="site-inc-data">
          <span style="font-weight: bold; color: green;"><fa style="width: 12px;" :icon="['fas', 'arrow-up']"></fa></span>
          <span style=""> 昨日上传</span>
          <a-divider type="vertical" />
          <span style="">{{ $formatSize(siteIncrease.yesterday[site.name].upload) }}</span>
          <br>
          <span style="font-weight: bold; color: red;"><fa style="width: 12px;" :icon="['fas', 'arrow-down']"></fa></span>
          <span style=""> 昨日下载</span>
          <a-divider type="vertical" />
          <span style="">{{ $formatSize(siteIncrease.yesterday[site.name].download) }}</span>
          <br>
          <span style="font-weight: bold; color: green;"><fa style="width: 12px;" :icon="['fas', 'arrow-up']"></fa></span>
          <span style=""> 本周上传</span>
          <a-divider type="vertical" />
          <span style="">{{ $formatSize(siteIncrease.week[site.name].upload) }}</span>
          <br>
          <span style="font-weight: bold; color: red;"><fa style="width: 12px;" :icon="['fas', 'arrow-down']"></fa></span>
          <span style=""> 本周下载</span>
          <a-divider type="vertical" />
          <span style="">{{ $formatSize(siteIncrease.week[site.name].download) }}</span>
          <br>
          <span style="font-weight: bold; color: green;"><fa style="width: 12px;" :icon="['fas', 'arrow-up']"></fa></span>
          <span style=""> 本月上传</span>
          <a-divider type="vertical" />
          <span style="">{{ $formatSize(siteIncrease.month[site.name].upload) }}</span>
          <br>
          <span style="font-weight: bold; color: red;"><fa style="width: 12px;" :icon="['fas', 'arrow-down']"></fa></span>
          <span style=""> 本月下载</span>
          <a-divider type="vertical" />
          <span style="">{{ $formatSize(siteIncrease.month[site.name].download) }}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="site-metric" v-if="siteSetting.theme === 'list'">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :loading="loading"
      :data-source="sites"
      :pagination="false"
      :scroll="{ x: 1440, y: scrollHeight }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">站点数据</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'name'">
          <img :src="record.icon || `/assets/icons/${record.name}.ico`" style="width: 32px; height: 32px; border-radius: 16px;" />
          <a-divider type="vertical" />
          <span style="">{{ record.name }}</span>
        </template>
        <template v-if="['upload', 'download'].indexOf(column.dataIndex) !== -1">
          {{ $formatSize(record[column.dataIndex]) }}
        </template>
        <template v-if="column.dataIndex === 'ratio'">
          {{ (record.upload / record.download).toFixed(2) }}
        </template>
        <template v-if="['yesterday', 'today', 'week', 'month'].indexOf(column.dataIndex) !== -1">
          ↑ {{ $formatSize(siteIncrease[column.dataIndex][record.name].upload) }}
          <br>
          ↓ {{ $formatSize(siteIncrease[column.dataIndex][record.name].download) }}
        </template>
      </template>
    </a-table>
  </div>
  <div class="site-metric" v-if="siteSetting.theme === 'overview'" style="text-align: center;">
    <div :class="`site-overview-${isMobile() ? 'mobile' : 'pc'}`">
      <div style="text-align: left; margin: 24px;">
        <a-form
          labelAlign="right"
          :labelWrap="true"
          :model="setting.siteInfo"
          size="small"
          @finish="modify"
          :labelCol="{ span: 4 }"
          :wrapperCol="{ span: 20 }"
          autocomplete="off"
          :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
          <a-form-item
            label="隐藏站点"
            name="hide"
            extra="在图中隐藏选中的站点">
            <a-checkbox-group style="width: 100%;" v-model:value="setting.siteInfo.hide">
              <a-row>
                <a-col v-for="site of sites.filter(item => item.name !== 'total')" :span="8" :key="site.name">
                  <a-checkbox  v-model:value="site.name">{{ site.name }}</a-checkbox>
                </a-col>
              </a-row>
            </a-checkbox-group>
          </a-form-item>
          <a-form-item
            label="隐藏站点名称"
            name="hideName"
            extra="在图中隐藏选中的站点名称, 仍显示数据信息">
            <a-checkbox-group style="width: 100%;" v-model:value="setting.siteInfo.hideName">
              <a-row>
                <a-col v-for="site of sites.filter(item => item.name !== 'total')" :span="8" :key="site.name">
                  <a-checkbox  v-model:value="site.name">{{ site.name }}</a-checkbox>
                </a-col>
              </a-row>
            </a-checkbox-group>
          </a-form-item>
          <a-form-item
            label="水印"
            name="watermark"
            extra="在图中添加水印">
            <a-input size="small" v-model:value="setting.siteInfo.watermark"/>
          </a-form-item>
          <a-form-item
            :wrapperCol="isMobile() ? { span:24 } : { span: 20, offset: 4 }">
            <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">保存</a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
    <div :class="`site-overview-${isMobile() ? 'mobile' : 'pc'}`">
      <img :src="overviewSrc" style="max-width: 100%; margin: 0 auto;"/>
    </div>
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
        title: '分享率',
        dataIndex: 'ratio',
        width: 32,
        sorter: (a, b) => (a.upload / a.download) - (b.upload / b.download)
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
      siteSetting: {
        theme: ''
      },
      loading: true,
      columns,
      overviewSrc: '/api/site/overview',
      scrollHeight: 640,
      sites: [],
      siteIncrease: {},
      setting: {
        siteInfo: {
          hide: [],
          hideName: [],
          watermark: 'vertex'
        }
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
    async listSite () {
      this.loading = true;
      try {
        const res = (await this.$api().site.list()).data;
        this.sites = res.siteList;
        this.siteIncrease = res.increase;
        if (this.sites[1]) {
          this.sites.unshift({
            name: 'total',
            icon: '/assets/images/logo.svg',
            upload: this.sites.map(item => +item.upload).reduce((a, b) => a + b),
            download: this.sites.map(item => +item.download).reduce((a, b) => a + b),
            seeding: this.sites.map(item => +item.seeding).reduce((a, b) => a + b),
            leeching: this.sites.map(item => +item.leeching).reduce((a, b) => a + b),
            seedingSize: this.sites.map(item => +item.seedingSize).reduce((a, b) => +a + +b)
          });
        }
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
    },
    async get () {
      try {
        const s = (await this.$api().setting.get()).data;
        this.setting = {
          siteInfo: s.siteInfo || this.setting.siteInfo,
          trustVertexPanel: s.trustVertexPanel
        };
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async modify () {
      try {
        await this.$api().setting.modify(this.setting);
        await this.$message().success('修改成功, 部分设置可能需要刷新页面生效.');
        this.overviewSrc = '/api/site/overview?_=' + Math.random();
        this.get();
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async gotoSiteOverview () {
      window.open('/api/site/overview');
    },
    handleRatioChange () {
      if (this.siteSetting.theme === 'overview' && !this.setting.trustVertexPanel) {
        this.$message().error('未开启信任 Vertex Panel, 总览图可能无法显示');
      }
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
    this.siteSetting.theme = this.isMobile() ? 'card' : 'list';
    this.listSite();
    this.get();
    this.scrollHeight = window.innerHeight - 32 - 38 - 49 - 41 - 60 - (this.isMobile() ? 60 : 0);
    window.onresize = () => {
      this.scrollHeight = window.innerHeight - 32 - 38 - 49 - 41 - 60 - (this.isMobile() ? 60 : 0);
    };
  }
};
</script>
<style scoped>
.site-metric {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}

.style-setting {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: center;
}

.highlight-1 {
  background: rgba(74, 90, 196, 0.4);
  backdrop-filter: blur(4px);
}

.highlight-2 {
  background: rgba(255, 184, 194, 0.3);
  backdrop-filter: blur(4px);
}

.highlight-3 {
  background: rgba(58, 143, 183, 0.3);
  backdrop-filter: blur(4px);
}

.highlight-4 {
  background: rgba(0, 137, 108, 0.4);
}

.item-class-pc {
  width: 100%;
  height: 220px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

.item-class-mobile {
  width: 100%;
  height: 220px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

.site-name {
  color: black;
  top: 24px;
  left: 12px;
  font-size: 24px;
  border-radius: 8px;
  position: absolute;
}

.site-data {
  color: black;
  top: 84px;
  left: 12px;
  font-size: 16px;
  border-radius: 8px;
  position: absolute;
}

.site-inc-data {
  color: black;
  top: 84px;
  right: 12px;
  width: 160px;
  font-size: 12px;
  border-radius: 8px;
  position: absolute;
}

.site-user {
  color: black;
  top: 24px;
  right: 12px;
  width: 96px;
  line-height: 20px;
  font-size: 16px;
  border-radius: 8px;
  position: absolute;
}

.site-overview-pc {
  width: 50%; float: left;
}

.site-overview-mobile {
  width: 100%;
}
</style>
