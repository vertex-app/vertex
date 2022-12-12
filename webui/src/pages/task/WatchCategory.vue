<template>
  <div style="font-size: 24px; font-weight: bold;">监控分类</div>
  <a-divider></a-divider>
  <div class="watch">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="watches"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">监控分类列表</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'enable'">
          <a-tag color="success" v-if="record.enable">启用</a-tag>
          <a-tag color="error" v-if="!record.enable">禁用</a-tag>
        </template>
        <template v-if="column.dataIndex === 'downloader'">
          {{ (downloaders.filter(item => item.id === record.downloader)[0] || {}).alias }}
        </template>
        <template v-if="column.title === '操作'">
          <span>
            <a @click="modifyClick(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
              <template #content>
                <a-button type="primary" danger @click="deleteWatch(record)" size="small">删除</a-button>
              </template>
              <a style="color: red">删除</a>
            </a-popover>
          </span>
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑监控分类</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="watch"
        size="small"
        @finish="modifyWatch"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给 监控分类取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="watch.alias"/>
        </a-form-item>
        <a-form-item
          label="启用"
          name="enable"
          extra="选择是否启用 监控分类"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="watch.enable">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="执行周期"
          name="cron"
          extra="脚本的执行周期, 默认 * * * * * 一分钟执行一次"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="watch.cron"/>
        </a-form-item>
        <a-form-item
          label="下载器"
          name="downloader"
          extra="所要监控的下载器"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="watch.downloader"  >
            <a-select-option v-for="downloader of downloaders" v-model:value="downloader.id" :key="downloader.id">{{ downloader.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="通知方式"
          name="notify"
          extra="通知方式, 用于推送信息, 留空则不推送信息">
          <a-select size="small" v-model:value="watch.notify">
            <a-select-option v-for="notification of notifications" v-model:value="notification.id" :key="notification.id">{{ notification.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="资源类型"
          name="type"
          extra="该分类下的资源类型, 选择该项目可以提高识别准确率, 如果是混合类型分类, 请不要勾选">
          <a-select size="small" v-model:value="watch.type">
            <a-select-option value="movie">电影</a-select-option>
            <a-select-option value="series">剧集</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="分类"
          name="category"
          extra="所要监控的分类, 也可以是保存路径, 需完全匹配"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="watch.category"/>
        </a-form-item>
        <a-form-item
          label="资料库文件夹"
          name="libraryPath"
          extra="链接目标的资料库文件夹, 填写规则: 电影:剧集, 如: movie:series"
          :rules="[{ validator: async (rule, value) => { if (value.split(':').length === 2) return; throw '格式 电影文件夹:剧集文件夹, 例 movie:series' } }]">
          <a-input size="small" v-model:value="watch.libraryPath"/>
        </a-form-item>
        <a-form-item
          label="链接规则"
          name="linkRule"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="watch.linkRule">
            <a-select-option v-for="linkRule of linkRules" v-model:value="linkRule.id" :key="linkRule.id">{{ linkRule.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="链接模式"
          name="linkMode"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          extra="链接模式">
          <a-select size="small" v-model:value="watch.linkMode">
            <a-select-option value="normal">正常模式</a-select-option>
            <a-select-option value="keepStruct-1">保留目录结构并添加顶层文件夹</a-select-option>
            <a-select-option value="keepStruct-2">保留目录结构并替换顶层文件夹</a-select-option>
            <a-select-option value="keepStruct-3">保留目录结构并不修改顶层文件夹</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="强制识别"
          name="forceScrape">
          <a-table
            :style="`font-size: ${isMobile() ? '12px': '14px'};`"
            :columns="scrapeColumns"
            size="small"
            :data-source="watch.forceScrape"
            :pagination="false"
            :scroll="{ x: 540 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'keyword'">
                <a-input size="small" v-model:value="record.keyword"/>
              </template>
              <template v-if="column.dataIndex === 'name'">
                <a-input size="small" v-model:value="record.name"/>
              </template>
              <template v-if="column.dataIndex === 'season'">
                <a-input size="small" v-model:value="record.season"/>
              </template>
              <template v-if="column.dataIndex === 'option'">
                <a style="color: red" @click="watch.forceScrape = watch.forceScrape.filter(item => item !== record)">删除</a>
              </template>
            </template>
          </a-table>
          <a-button
            type="primary"
            @click="watch.forceScrape.push({ ...scrapeMap })"
            size="small">
            新增条目
          </a-button>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;"  @click="clearWatch()">清空</a-button>
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
        title: 'ID',
        dataIndex: 'id',
        width: 18,
        fixed: true
      }, {
        title: '别名',
        dataIndex: 'alias',
        width: 20
      }, {
        title: '启用',
        dataIndex: 'enable',
        width: 15
      }, {
        title: '下载器',
        dataIndex: 'downloader',
        width: 24
      }, {
        title: '分类',
        dataIndex: 'category',
        width: 24
      }, {
        title: '操作',
        width: 24
      }
    ];
    const scrapeColumns = [
      {
        title: '关键词',
        dataIndex: 'keyword',
        fixed: true,
        width: 24
      }, {
        title: '名称',
        dataIndex: 'name',
        width: 24
      }, {
        title: '季',
        dataIndex: 'season',
        width: 6
      }, {
        title: '操作',
        dataIndex: 'option',
        width: 6
      }
    ];
    return {
      columns,
      scrapeColumns,
      watches: [],
      downloaders: [],
      linkRules: [],
      notifications: [],
      watch: {},
      scrapeMap: {
        keyword: '',
        name: '',
        season: ''
      },
      defaultWatch: {
        enable: true,
        cron: '* * * * *',
        downlaoder: '',
        category: '',
        libraryPath: '',
        linkRule: '',
        notify: '',
        forceScrape: []
      },
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
    async listWatch () {
      this.loading = true;
      try {
        const res = await this.$api().watch.list();
        this.watches = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
      this.loading = false;
    },
    async listLinkRule () {
      try {
        const res = await this.$api().linkRule.list();
        this.linkRules = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async listDownloader () {
      try {
        const res = await this.$api().downloader.list();
        this.downloaders = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async listNotification () {
      try {
        const res = await this.$api().notification.list();
        this.notifications = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modifyWatch () {
      try {
        await this.$api().watch.modify({ ...this.watch });
        this.$message().success((this.watch.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listWatch(), 1000);
        this.clearWatch();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      this.watch = {
        ...row,
        forceScrape: [...row.forceScrape]
      };
    },
    async deleteWatch (row) {
      try {
        await this.$api().watch.delete(row.id);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listWatch();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    clearWatch () {
      this.watch = {
        ...this.defaultWatch,
        forceScrape: []
      };
    }
  },
  async mounted () {
    this.clearWatch();
    this.listWatch();
    this.listDownloader();
    this.listNotification();
    this.listLinkRule();
  }
};
</script>
<style scoped>
.watch {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
