<template>
  <div style="font-size: 24px; font-weight: bold;">站点</div>
  <a-divider></a-divider>
  <div class="site">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="siteList"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">站点列表</span>
      </template>
      <template #headerCell="{ column }">
        <template v-if="column.title === '操作'">
          操作
          <a-divider type="vertical" />
          <a @click="refresh()">刷新所有</a>
        </template>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'upload'">
          {{ $formatSize(record.upload) }}
        </template>
        <template v-if="column.dataIndex === 'download'">
          {{ $formatSize(record.download) }}
        </template>
        <template v-if="column.dataIndex === 'updateTime'">
          {{ $moment(record.updateTime * 1000).format('MM-DD HH:mm:ss') }}
        </template>
        <template v-if="column.title === '操作'">
          <span>
            <a @click="goto(record)">打开</a>
            <a-divider type="vertical" />
            <a @click="refresh(record)">刷新</a>
            <a-divider type="vertical" />
            <a-dropdown>
              <a class="ant-dropdown-link" @click.prevent>
                操作
                <fa :icon="['fas', 'chevron-down']"></fa>
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item>
                    <a @click="modifyClick(record)">编辑</a>
                  </a-menu-item>
                  <a-menu-item danger>
                    <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
                      <template #content>
                        <a-button type="primary" danger @click="deleteSite(record)" size="small">删除</a-button>
                      </template>
                      <a>删除</a>
                    </a-popover>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </span>
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑站点</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="site"
        size="small"
        @finish="modifySite"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="站点"
          name="name"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="site.name"  >
            <a-select-option :disabled="siteList.filter(item => item.name === site)[0]" v-for="site of sites" :key="site" :value="site">{{ site }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="启用"
          name="enable"
          extra="选择是否启用站点"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox :disable="site.used" v-model:checked="site.enable">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="更新周期"
          name="cron"
          extra="Crontab 表达式, 默认每天的 11:55 与 23:55 各更新一次"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="site.cron"/>
        </a-form-item>
        <a-form-item
          label="优先级"
          name="priority"
          extra="选种规则内的站点优先级, 默认为 0">
          <a-input size="small" v-model:value="site.priority"/>
        </a-form-item>
        <a-form-item
          label="拉取远程种子"
          name="pullRemoteTorrent"
          extra="豆瓣任务启动超级模式时, 将使用本站点拉取远程种子"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox :disable="site.used" v-model:checked="site.pullRemoteTorrent">拉取远程种子</a-checkbox>
        </a-form-item>
        <a-form-item
          label="搜索 R18 分区"
          name="adult"
          v-if="site.name === 'MTeam'"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox :disable="site.used" v-model:checked="site.adult">搜索 R18 分区</a-checkbox>
        </a-form-item>
        <a-form-item
          label="Cookie"
          name="cookie"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="site.cookie"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;" @click="clearSite()">清空</a-button>
        </a-form-item>
      </a-form>
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
        width: 32,
        sorter: (a, b) => a.name.localeCompare(b.name),
        fixed: true
      }, {
        title: '用户名',
        dataIndex: 'username',
        sorter: (a, b) => a.username.localeCompare(b.username),
        width: 30
      }, {
        title: '上传',
        dataIndex: 'upload',
        sorter: (a, b) => a.upload - b.upload,
        width: 30
      }, {
        title: '下载',
        dataIndex: 'download',
        sorter: (a, b) => a.download - b.download,
        width: 30
      }, {
        title: '上次刷新时间',
        dataIndex: 'updateTime',
        sorter: (a, b) => a.updateTime - b.updateTime,
        width: 40
      }, {
        title: '操作',
        width: 40
      }
    ];
    return {
      refreshState: '刷新全部站点',
      columns,
      defaultSite: {
        name: '',
        cookie: '',
        cron: '55 11,23 * * *',
        enable: true,
        priority: '0',
        adult: false,
        pullRemoteTorrent: false
      },
      site: {},
      sites: ['HaresClub', 'LemonHD', 'HDChina',
        'HDSky', 'HDHome', 'PTerClub', 'Audiences', 'OurBits',
        'SpringSunDay', 'MTeam', 'OpenCD', 'U2', 'BeiTai',
        'TCCF', 'TLFBits', 'PTMSG', 'HDFans', 'DICMusic', 'GPW',
        'BTSchool', 'TJUPT', 'ToTheGlory', 'KeepFriends', 'HDDolby',
        'HDArea', 'SoulVoice', 'PTHome', 'NYPT', 'CHDBits'].sort(),
      siteInfo: {},
      displayAll: true,
      loading: true,
      siteList: []
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
      try {
        const res = await this.$api().site.list();
        this.siteInfo = res;
        this.loadSite();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    loadSite () {
      this.siteList = [];
      const siteList = this.siteInfo.data.siteList;
      for (const site of siteList) {
        site.id = site.name;
        site.display = site.display === undefined ? true : site.display;
        this.siteList.push({ ...site });
      }
    },
    goto (record) {
      window.open(`/proxy/site/${record.name}/`);
    },
    async modifySite () {
      try {
        await this.$api().site.modify({ ...this.site });
        this.$message().success((this.site.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listSite(), 1000);
        this.clearSite();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      this.site = { ...row };
    },
    async deleteSite (row) {
      if (row.used) {
        this.$message().error('组件被占用, 取消占用后删除');
        return;
      }
      try {
        await this.$api().site.delete(row.name);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listSite();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async clearSite () {
      this.site = { ...this.defaultSite };
    },
    async refresh (row) {
      try {
        await this.$api().site.refresh(row?.name);
        this.$message().success('刷新成功, 列表正在刷新...');
        setTimeout(() => this.listSite(), 1000);
      } catch (e) {
        this.$message().error(e.message);
      }
      this.listSite();
    }
  },
  async mounted () {
    this.site = { ...this.defaultSite };
    await this.listSite();
  }
};
</script>
<style scoped>
.site {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
