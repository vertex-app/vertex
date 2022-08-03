<template>
  <div style="font-size: 24px; font-weight: bold;">批量链接</div>
  <a-divider></a-divider>
  <div class="bulkLink">
    <div style="text-align: left; ">
      <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">批量链接</div>
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="bulkLinkInfo"
        size="small"
        @finish="getBulkLinkList"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        class='bulk-link-form'>
        <a-form-item
          label="下载器"
          name="client">
          <a-select size="small" v-model:value="bulkLinkInfo.client">
            <a-select-option v-for="downloader of downloaders" v-model:value="downloader.id" :key="downloader.id">{{ downloader.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="链接规则"
          name="linkRule"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="bulkLinkInfo.linkRule">
            <a-select-option v-for="linkRule of linkRules" v-model:value="linkRule.id" :key="linkRule.id">{{ linkRule.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="类型"
          name="type"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="bulkLinkInfo.type">
            <a-select-option value="movie">电影</a-select-option>
            <a-select-option value="series">剧集</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="资料库文件夹"
          name="libraryPath"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="bulkLinkInfo.libraryPath">
            <template v-for="subscribe of subscribes" :key="subscribe.id">
              <a-select-option
                v-for="category of subscribe.categories"
                :value="category.libraryPath"
                :key="subscribe.id + category.libraryPath">
                {{category.libraryPath}}
              </a-select-option>
            </template>
          </a-select>
        </a-form-item>
        <a-form-item
          label="关键词"
          name="keyword"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="bulkLinkInfo.keyword"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 20, offset: 4 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">检查</a-button>
          <a-button type="primary" danger style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;"  @click="doScrape">识别</a-button>
          <a-button type="primary" danger style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;"  @click="doLink">执行</a-button>
        </a-form-item>
      </a-form>
      <a-divider></a-divider>
      <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">选择文件</div>
      <a-form
        labelAlign="right"
        :labelWrap="true"
        size="small"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        class='bulk-link-form'>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 20, offset: 4 }">
          <a-select size="small" v-model:value="selectTorrent" style="width: calc(100% - 80px);">
            <a-select-option
              :disabled="torrent.visible"
              v-for="torrent of torrentList"
              v-model:value="torrent.hash"
              :key="torrent.hash">{{ file.file }}
            </a-select-option>
          </a-select>
          <a-button
            size="small"
            @click="() => { torrentList.filter(item => item.hash === selectTorrent)[0].visible = 0; selectTorrent = '' }"
            type="primary"
            style="width: 64px; margin-left: 16px;">
            检查
          </a-button>
        </a-form-item>
      </a-form>
      <a-divider></a-divider>
      <a-table
        :style="`font-size: ${isMobile() ? '12px': '14px'};`"
        :columns="columns"
        size="small"
        :data-source="torrentList.filter(item => item.visible)"
        :pagination="false"
        :scroll="{ x: 640 }"
      >
        <template #title>
          <span style="font-size: 16px; font-weight: bold;">批量链接列表</span>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'bulkLinkFile'">
            {{ record.newLinkFile || record.bulkLinkFile }}
          </template>
          <template v-if="column.dataIndex === 'scrapedName'">
            <a-input size="small" v-model:value="record.scrapedName"/>
          </template>
          <template v-if="column.dataIndex === 'status'">
            <span :style="{ color: record.status === '识别失败' ? 'red' : '' }">
              {{ record.status }}
            </span>
          </template>
          <template v-if="column.title === '操作'">
            <fa :icon="['fas', 'times']" @click="() => { record.visible = false }" style="width: 20px; color: red; cursor: pointer;"></fa>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    const columns = [
      {
        title: '识别名称',
        dataIndex: 'scrapedName',
        width: 10,
        fixed: true
      }, {
        title: '状态',
        dataIndex: 'status',
        width: 10
      }, {
        title: '种子名称',
        dataIndex: 'name',
        width: 60
      }, {
        title: '操作',
        width: 10
      }
    ];
    return {
      columns,
      hash: '',
      torrentList: [],
      downloaders: [],
      subscribes: '',
      selectTorrent: '',
      linkRules: [],
      bulkLinkInfo: {
        libraryPath: ''
      },
      torrentInfo: {}
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
    async getBulkLinkList () {
      try {
        const res = await this.$api().torrent.getBulkLinkList(this.bulkLinkInfo.keyword, this.bulkLinkInfo.client);
        this.torrentList = res.data.map(item => { return { ...item, visible: true, scrapedName: '', status: '待识别' }; });;
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async scrapeName (torrent) {
      try {
        const res = await this.$api().torrent.scrapeName(torrent.name, this.bulkLinkInfo.type);
        this.torrentList.filter(item => item.hash === torrent.hash)[0].scrapedName = res.data;
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async listLinkRule () {
      try {
        const res = await this.$api().linkRule.list();
        this.linkRules = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async listSubscribe () {
      try {
        const res = await this.$api().subscribe.list();
        this.subscribes = res.data;
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
    async doScrape () {
      for (const torrent of this.torrentList) {
        if (!torrent.visible) continue;
        torrent.status = '识别中';
        await this.scrapeName(torrent);
        torrent.status = torrent.scrapedName ? '已识别' : '识别失败';
      }
    },
    async doLink () {
      for (const torrent of this.torrentList) {
        if (torrent.scrapedName !== '') {
          torrent.status = '待链接';
        }
      }
      for (const torrent of this.torrentList) {
        if (torrent.scrapedName === '' || !torrent.visible) {
          continue;
        }
        const res = await this.$api().torrent.link({
          direct: true,
          hash: torrent.hash,
          type: this.type,
          mediaName: torrent.scrapedName,
          linkRule: this.linkRule,
          client: torrent.client,
          libraryPath: this.libraryPath,
          savePath: torrent.savePath
        });
        torrent.status = (res ? res.data : '') || '链接失败';
      }
    }

  },
  async mounted () {
    this.listDownloader();
    this.listSubscribe();
    this.listLinkRule();
  }
};
</script>
<style scoped>
.bulkLink {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}

.bulk-link-form {
  width: min(calc(100vw - 36px), 1200px);
  border-radius: 4px;
  padding: 12px;
  transition: all 0.5s;
}
</style>
