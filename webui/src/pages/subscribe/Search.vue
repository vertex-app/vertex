<template>
  <div style="font-size: 24px; font-weight: bold;">影视搜索</div>
  <a-divider></a-divider>
  <div class="subscribe-search" >
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
          label="豆瓣账号"
          name="subscribe"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="qs.subscribe">
            <a-select-option v-for="subscribe of subscribes" v-model:value="subscribe.id" :key="subscribe.id">{{ subscribe.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="分类标签"
          name="tag"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select
            size="small"
            v-model:value="qs.tag"
            :options="(subscribes.filter(item => item.id === qs.subscribe)[0] || {categories: []}).categories.map(item => ({ text: item.doubanTag, value: item.doubanTag }))">
          </a-select>
        </a-form-item>
        <a-form-item
          label="搜索关键词"
          name="keyword"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="qs.keyword" style="width: 240px"/>
          <a-button size="small" type="primary" style="margin-left: 24px;" html-type="submit">搜索</a-button>
          <a-button size="small" v-if="!isMobile()" type="primary" style="margin-left: 24px;" @click="refreshSubscribe(qs.subscribe)" :disabled="refreshed || !isAdded">刷新想看列表</a-button>
        </a-form-item>
        <a-form-item
          v-if="isMobile()">
          <a-button size="small" type="primary" @click="refreshSubscribe(qs.subscribe)" :disabled="refreshed || !isAdded">刷新想看列表</a-button>
        </a-form-item>
      </a-form>
    </div>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; text-align: left;">搜索结果</div>
    <div
      v-for="item of results"
      :key="item.id"
      :style="`display: inline-block; margin: 12px; text-align: center; width: ${isMobile() ? '160px' : '200px'}; vertical-align: top;`">
      <div :class="isMobile() ? 'item-class-mobile' : 'item-class-pc'">
        <img v-lazy="item.poster" @click="gotoDetail(item)" style="cursor: pointer; width: 100%; height: 100%;">
        <div @click="addWish(item)" style="cursor: pointer; color: lightpink; bottom: 0px; width: 100%; position: absolute; background-color: rgba(0,0,0,0.3); backdrop-filter: blur(4px);">
          <span>[{{ added[item.id] ? '已订阅' : '点击订阅' }}]</span>
        </div>
      </div>
      <div style="margin: 6px auto; max-width: 100%;" v-if="isMobile()">
        <div style="height: 48px;">
          {{item.title}} · {{item.year}}
        </div>
      </div>
      <div style="margin: 6px auto;" v-if="!isMobile()">
        <div style="height: 48px;">
          {{item.title}} · {{item.year}}
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    const columns = [
      {
        title: '标题',
        dataIndex: 'title',
        width: 32,
        fixed: true
      }, {
        title: '年份',
        dataIndex: 'year',
        width: 8
      }, {
        title: '集数',
        dataIndex: 'episode',
        width: 8
      }, {
        title: '操作',
        width: 8
      }
    ];
    const columnsWithPoster = [
      {
        title: '海报',
        dataIndex: 'poster',
        width: 8,
        fixed: true
      }, {
        title: '标题',
        dataIndex: 'title',
        width: 32
      }, {
        title: '年份',
        dataIndex: 'year',
        width: 8
      }, {
        title: '集数',
        dataIndex: 'episode',
        width: 8
      }, {
        title: '操作',
        width: 8
      }
    ];
    const qs = {
      subscribe: '',
      keyword: '',
      tag: ''
    };
    return {
      loading: false,
      subscribes: [],
      results: [],
      columns,
      added: {},
      isAdded: false,
      refreshed: false,
      columnsWithPoster,
      showPoster: true,
      qs
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
    async listSubscribe () {
      try {
        const res = await this.$api().subscribe.list();
        this.subscribes = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async search () {
      try {
        const qs = {
          douban: this.qs.subscribe,
          keyword: this.qs.keyword
        };
        const res = await this.$api().subscribe.search(qs);
        this.results = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async addWish (record) {
      try {
        if (this.added[record.id]) {
          return;
        }
        const body = {
          douban: this.qs.subscribe,
          id: record.id,
          tag: this.qs.tag
        };
        await this.$api().subscribe.addWish(body);
        this.added[record.id] = 1;
        this.isAdded = true;
        await this.$message().success('添加成功!');
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async gotoDetail (record) {
      window.open(record.link);
    },
    async refreshSubscribe (id) {
      try {
        await this.$api().subscribe.refreshSubscribe(id);
        this.refreshed = true;
        this.$message().success('已启动刷新任务');
        await this.listSubscribe();
      } catch (e) {
        this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    await this.listSubscribe();
  }
};
</script>
<style scoped>
.subscribe-search {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: center;
}

.item-class-pc {
  width: 200px;
  height: 280px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

.item-class-mobile {
  width: 160px;
  height: 224px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}
</style>
