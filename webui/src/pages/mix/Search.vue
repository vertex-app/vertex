<template>
  <div style="font-size: 24px; font-weight: bold;">种子搜索</div>
  <a-divider></a-divider>
  <div class="mix-search" >
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="qs"
        size="small"
        @finish="search"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="指定站点"
          name="sites">
          <a-checkbox-group style="width: 100%;" v-model:value="qs.sites">
            <a-row>
              <a-col v-for="site of sites" :span="isMobile() ? 8 : 6" :key="site.name">
                <a-checkbox  v-model:value="site.name">{{ site.text }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
          <div style="margin-top: 12px;">
            <a-button size="small" type="primary" @click="qs.sites = sites.map(item => item.name);">全部选中</a-button>
            <a-button size="small" type="primary" style="margin-left: 24px;" @click="qs.sites = [];">取消选中</a-button>
          </div>
        </a-form-item>
        <a-form-item
          label="搜索关键词"
          name="keword">
          <a-input size="small" v-model:value="qs.keyword" style="width: 240px"/>
          <a-button size="small" type="primary" style="margin-left: 24px;" html-type="submit">搜索</a-button>
        </a-form-item>
        <a-form-item
          label="二次筛选">
          <a-input size="small" v-model:value="filterKey" style="width: 240px"/>
          <a-button size="small" type="primary" style="margin-left: 24px;" @click="filterTorrent">筛选</a-button>
        </a-form-item>
      </a-form>
    </div>
    <a-divider></a-divider>
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :loading="loading"
      :data-source="torrents"
      :pagination="pagination"
      @change="handleChange"
      :scroll="{ x: 960 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">种子搜索</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="['size'].indexOf(column.dataIndex) !== -1">
          {{ $formatSize(record[column.dataIndex]) }}
        </template>
        <template v-if="column.dataIndex === 'title'">
          <a @click="gotoDetail(record)">{{ record.title }}</a>
          <br>
          <span style="font-size: 12px;">{{ record.subtitle }}</span><a style="font-size: 12px;" @click="gotoDetail(record, true)">[代理打开]</a>
          <br>
          <span style="font-size: 12px; color: red;">{{ record.tags.map(item => `[${item}]`).join('') }}</span>
        </template>
        <template v-if="column.dataIndex === 'seeder'">
          {{[record.seeders, record.leechers, record.snatches].join(' / ')}}
        </template>
        <template v-if="column.dataIndex === 'time'">
          <div style="text-align: center">
            {{ $moment(record.time * 1000).format('YYYY-MM-DD')}}
            <br>
            {{ $moment(record.time * 1000).format('HH:mm:ss')}}
          </div>
        </template>
        <template v-if="column.title === '操作'">
          <a @click="openModal(record)">推送</a>
        </template>
      </template>
    </a-table>
  </div>
  <a-modal
    v-model:visible="modalVisible"
    title="推送种子"
    :footer="null">
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="modalInfo"
        size="small"
        @finish="push"
        :labelCol="{ span: 6 }"
        :wrapperCol="{ span: 18 }"
        autocomplete="off">
        <a-form-item
          :wrapperCol="{ span:24 }">
          <span>
            {{ torrent.title }}
          </span>
        </a-form-item>
        <a-form-item
          label="下载器"
          name="client">
          <a-select size="small" v-model:value="modalInfo.client">
            <template v-for="downloader of downloaders" :key="downloader.id">
              <a-select-option
                :value="downloader.id">
                {{ downloader.alias }}
              </a-select-option>
            </template>
          </a-select>
        </a-form-item>
        <a-form-item
          label="分类"
          name="category">
          <a-select
            size="small"
            @search="(value) => categories[0].value = value"
            :showSearch="true"
            v-model:value="modalInfo.category"
            :options="categories">
          </a-select>
        </a-form-item>
        <a-form-item
          label="保存路径"
          name="savePath">
          <a-select
            size="small"
            @search="(value) => savePaths[0].value = value"
            :showSearch="true"
            v-model:value="modalInfo.savePath"
            :options="savePaths">
          </a-select>
        </a-form-item>
        <a-form-item
          label="自动管理"
          name="autoTMM">
          <a-checkbox v-model:checked="modalInfo.autoTMM">自动管理</a-checkbox>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 18, offset: 6 }">
          <a-button size="small" @click="() => modalVisible = false">取消</a-button>
          <a-button size="small" type="primary" style="margin-left: 24px;" html-type="submit">推送</a-button>
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>
<script>
export default {
  data () {
    const columns = [
      {
        title: '站点',
        dataIndex: 'site',
        width: 32,
        filters: [],
        filterSearch: true,
        fixed: true
      }, {
        title: '种子名称',
        dataIndex: 'title',
        resizable: true,
        width: 180
      }, {
        title: '分类',
        dataIndex: 'category',
        width: 32
      }, {
        title: '种子大小',
        dataIndex: 'size',
        sorter: (a, b) => a.size - b.size,
        width: 32
      }, {
        title: '做种 / 下载 / 完成',
        dataIndex: 'seeder',
        sorter: (a, b) => a.seeders - b.seeders,
        width: 44
      }, {
        title: '发布时间',
        dataIndex: 'time',
        sorter: (a, b) => a.time - b.time,
        width: 32
      }, {
        title: '操作',
        width: 24
      }
    ];
    const qs = {
      page: 1,
      length: 20,
      sites: [],
      keyword: ''
    };
    const pagination = {
      position: ['topRight', 'bottomRight'],
      total: 0,
      current: 1,
      pageSize: qs.length,
      showSizeChanger: false
    };
    return {
      modalVisible: false,
      loading: false,
      pagination,
      categories: [],
      savePaths: [],
      columns,
      qs,
      torrents: [],
      torrentsOri: [],
      subscribes: [],
      downloaders: [],
      torrent: {},
      filterKey: '',
      modalInfo: {
        category: '',
        savePath: '',
        client: '',
        autoTMM: false
      },
      sites: []
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
    async searchSingleSite (site) {
      try {
        this.sites.filter(item => item.name === site)[0].text = site + ' 搜索中...';
        const res = (await this.$api().site.search(this.qs.keyword, [site])).data;
        this.torrentsOri = this.torrentsOri.concat(res.map(item => [...item.torrentList.map(i => ({ ...i, site: item.site }))]).flat());
        this.torrents = [...this.torrentsOri];
        this.pagination.total = this.torrents.length;
        sessionStorage.setItem('search-mix-torrents', JSON.stringify({
          torrents: this.torrents,
          keyword: this.keyword
        }));
        this.loading = false;
        this.sites.filter(item => item.name === site)[0].text = site + ` [${res[0].torrentList.length}]`;
      } catch (e) {
        await this.$message().error(e.message);
        this.sites.filter(item => item.name === site)[0].text = site + ' 搜索失败';
        this.loading = false;
      }
    },
    async search () {
      this.loading = true;
      this.torrentsOri = [];
      this.torrents = [];
      for (const site of this.qs.sites) {
        this.searchSingleSite(site);
      }
    },
    async push () {
      try {
        const qs = {
          ...this.modalInfo,
          id: this.torrent.id,
          link: this.torrent.link,
          site: this.torrent.site
        };
        const res = (await this.$api().site.pushTorrent(qs)).message;
        await this.$message().success(res);
        this.modalVisible = false;
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async listSite () {
      try {
        const res = await this.$api().site.listSite({ search: 1 });
        this.qs.sites = res.data;
        this.sites = res.data.map(item => ({ text: item, name: item }));
        this.columns[0].filters = this.qs.sites.map(item => ({ text: item, value: item }));
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async gotoDetail (record, proxy) {
      if (!record.link) return await this.$message().error('链接不存在');
      window.open(proxy ? record.link.replace(/https:\/\/.*?\//, `/proxy/site/${record.site}/`) : record.link);
    },
    async handleChange (pagination, filters) {
      this.qs.page = pagination.current;
      this.pagination.current = pagination.current;
      if (filters.site && filters.site[0]) {
        this.torrents = this.torrents.filter(item => filters.site.indexOf(item.site) !== -1);
        this.pagination.total = this.torrents.length;
      } else {
        this.torrents = [...this.torrents];
        this.pagination.total = this.torrents.length;
      }
    },
    async filterTorrent () {
      // this.refreshList();
      this.torrents = this.torrentsOri.filter(i => {
        return i.title.toLowerCase().indexOf(this.filterKey.toLowerCase()) !== -1 || i.subtitle.toLowerCase().indexOf(this.filterKey.toLowerCase()) !== -1;
      });
      this.pagination.current = 1;
      this.pagination.total = this.torrents.length;
    },
    async listSubscribe () {
      try {
        const _categories = (localStorage.getItem('vertex-search-categories') || '').split(',').filter(item => item).map(item => ({ value: item }));
        const _savepaths = (localStorage.getItem('vertex-search-savepaths') || '').split(',').filter(item => item).map(item => ({ value: item }));
        const res = await this.$api().subscribe.list();
        this.subscribes = res.data;
        this.categories = [{ value: '手动输入' }].concat(_categories);
        for (const item of this.subscribes.map(item => item.categories).flat()) {
          if (this.categories.map(subitem => subitem.value).indexOf(item.category) === -1) {
            this.categories.push({ value: item.category });
          }
        }
        this.savePaths = [{ value: '手动输入' }].concat(_savepaths);
        for (const item of this.subscribes.map(item => item.categories).flat()) {
          if (this.savePaths.map(subitem => subitem.value).indexOf(item.savePath) === -1) {
            this.savePaths.push({ value: item.savePath });
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
    openModal (record) {
      this.torrent = { ...record };
      this.modalVisible = true;
    }
  },
  async mounted () {
    this.listSite();
    this.listSubscribe();
    this.listDownloader();
    const torrentsStr = sessionStorage.getItem('search-mix-torrents');
    if (torrentsStr) {
      const torrents = JSON.parse(torrentsStr);
      this.torrentsOri = torrents.torrents;
      this.torrents = [...this.torrentsOri];
      this.qs.keyword = torrents.keyword;
      this.pagination.total = this.torrents.length;
    }
  }
};
</script>
<style scoped>
.mix-search {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
