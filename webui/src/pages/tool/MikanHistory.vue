<template>
  <div style="font-size: 24px; font-weight: bold;">蜜柑番剧历史下载</div>
  <a-divider></a-divider>
  <div class="mikan-history">
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="info"
        size="small"
        @finish="doSearch"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="RSS"
          name="rss"
          extra="通过 RSS 任务执行规则筛选与推送操作"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="info.rss">
            <a-select-option v-for="rss of rssList" v-model:value="rss.id" :key="rss.id">{{ rss.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="番剧"
          name="name"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          extra="搜索的关键词，可以搜番名也可以带字幕组，例: 夏日重现 或 夏日重现 诸神">
          <a-input size="small" v-model:value="info.name"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">检查</a-button>
          <a-button type="primary"  @click="doPush" style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;">推送</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
  <a-divider></a-divider>
  <div class="mikan-history" style="text-align: left; ">
    <a-form
      labelAlign="right"
      :labelWrap="true"
      size="small"
      :labelCol="{ span: 6 }"
      :wrapperCol="{ span: 18 }"
      autocomplete="off">
      <a-form-item
        :wrapperCol="{ span:24 }">
        <a-table
          :style="`font-size: ${isMobile() ? '12px': '14px'};`"
          :columns="dryrunColumns"
          size="small"
          :loading="loading"
          :data-source="filteredTorrents"
          :pagination="false"
          :scroll="{ x: 960 }"
        >
          <template #title>
            <span style="font-size: 16px; font-weight: bold;">种子列表</span>
            <a-divider type="vertical" />
            <a-switch @change="filterTorrent(record)" v-model:checked="unfilter" checked-children="显示" un-checked-children="隐藏"/>
          </template>
          <template #headerCell="{ column }">
            <template v-if="column.dataIndex === 'checked'">
              <a-checkbox @change="selectAll" />
              <a-divider type="vertical" />
              选中
            </template>
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'checked'">
              <a-checkbox v-model:checked="record.checked" />
            </template>
            <template v-if="column.dataIndex === 'size'">
              {{ $formatSize(record.size) }}
            </template>
          </template>
        </a-table>
      </a-form-item>
    </a-form>
  </div>
</template>
<script>
export default {
  data () {
    const dryrunColumns = [
      {
        title: '选中',
        dataIndex: 'checked',
        width: 4
      }, {
        title: '种子标题',
        dataIndex: 'name',
        width: 288
      }, {
        title: '种子大小',
        dataIndex: 'size',
        width: 48
      }, {
        title: '结果',
        dataIndex: 'status',
        width: 96
      }
    ];
    return {
      dryrunColumns,
      torrents: [],
      unfilter: false,
      filteredTorrents: [],
      info: {},
      loading: false,
      rssList: []
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
    async listRss () {
      try {
        const res = await this.$api().rss.list();
        this.rssList = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async doSearch () {
      try {
        this.loading = true;
        const res = await this.$api().rss.mikanSearch(this.info);
        this.torrents = res.data;
        this.filterTorrent();
      } catch (e) {
        await this.$message().error(e.message);
      }
      this.loading = false;
    },
    async doPush () {
      try {
        const torrents = this.filteredTorrents.filter(item => item.checked);
        const body = {
          torrents,
          rss: this.info.rss
        };
        const res = await this.$api().rss.mikanPush(body);
        this.$message().success(res.message);
      } catch (e) {
        await this.$message().error(e.message);
      }
      this.loading = false;
    },
    async filterTorrent () {
      this.loading = true;
      this.filteredTorrents = this.unfilter ? this.torrents : this.torrents.filter(item => item.status.indexOf('匹配到选择规则') === 0 || item.status.indexOf('无选择规则') === 0);
      this.filteredTorrents = this.filteredTorrents.map(item => ({
        ...item,
        checked: item.status.indexOf('匹配到选择规则') === 0 || item.status.indexOf('无选择规则') === 0
      }));
      this.loading = false;
    },
    async selectAll (e) {
      for (const t of this.filteredTorrents) {
        t.checked = e.target.checked;
      }
    }
  },
  async mounted () {
    this.listRss();
  }
};
</script>
<style scoped>
.mikan-history {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
