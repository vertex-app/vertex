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
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="下载器"
          name="client"
          extra="留空则选择所有下载器">
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
          <a-select size="small"
            :options="libraryPaths"
            @search="(value) => libraryPaths[0].value = value"
            :showSearch="true"
            v-model:value="bulkLinkInfo.libraryPath">
          </a-select>
        </a-form-item>
        <a-form-item
          label="链接模式"
          name="linkMode"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          extra="链接模式">
          <a-select size="small" v-model:value="bulkLinkInfo.linkMode">
            <a-select-option value="normal">正常模式</a-select-option>
            <a-select-option value="keepStruct-1">保留目录结构并添加顶层文件夹</a-select-option>
            <a-select-option value="keepStruct-2">保留目录结构并替换顶层文件夹</a-select-option>
            <a-select-option value="keepStruct-3">保留目录结构并不修改顶层文件夹</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="关键词"
          name="keyword"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          extra="分类或保存路径包含的关键词">
          <a-input size="small" v-model:value="bulkLinkInfo.keyword"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
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
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-select size="small" v-model:value="selectTorrent" style="width: calc(100% - 80px);">
            <a-select-option
              :disabled="torrent.visible"
              v-for="torrent of torrentList"
              v-model:value="torrent.hash"
              :key="torrent.hash">{{ torrent.name }}
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
      libraryPaths: [],
      selectTorrent: '',
      linkRules: [],
      bulkLinkInfo: {
        libraryPath: '',
        linkMode: 'normal'
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
        this.torrentList = res.data.map(item => { return { ...item, visible: true, scrapedName: '', status: '待识别' }; });
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
        this.libraryPaths = [{ value: '手动输入' }];
        for (const category of this.subscribes.map(item => item.categories).flat()) {
          if (this.libraryPaths.map(item => item.value).indexOf(category.libraryPath) === -1) {
            this.libraryPaths.push({ value: category.libraryPath });
          }
        }
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
        if (this.bulkLinkInfo.linkMode === 'keepStruct-3') {
          torrent.status = '已识别';
          torrent.scrapedName = '不需要~';
          continue;
        }
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
          direct: this.bulkLinkInfo.linkMode === 'normal',
          keepStruct: this.bulkLinkInfo.linkMode !== 'normal',
          replaceTopDir: this.bulkLinkInfo.linkMode === 'keepStruct-2',
          keepTopDir: this.bulkLinkInfo.linkMode === 'keepStruct-3',
          hash: torrent.hash,
          type: this.bulkLinkInfo.type,
          mediaName: torrent.scrapedName,
          linkRule: this.bulkLinkInfo.linkRule,
          client: torrent.client,
          libraryPath: this.bulkLinkInfo.libraryPath,
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
