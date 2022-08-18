<template>
  <div style="font-size: 24px; font-weight: bold;">种子聚合</div>
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
          <a-select size="small" v-model:value="qs.subscribe"  >
            <a-select-option v-for="subscribe of subscribes" v-model:value="subscribe.id" :key="subscribe.id">{{ subscribe.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="分类标签"
          name="tag"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="qs.tag"  >
            <a-select-option
              v-for="tag of (subscribes.filter(item => item.id === qs.subscribe)[0] || {categories: []}).categories.map(item => item.category)"
              v-model:value="qs.tag"
              :key="'' + tag + qs.subscribe">
              {{ tag }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="搜索关键词"
          name="keword">
          <a-input size="small" v-model:value="qs.keyword" style="width: 240px"/>
          <a-button size="small" type="primary" style="margin-left: 24px;" html-type="submit">搜索</a-button>
        </a-form-item>
      </a-form>
    </div>
    <a-divider></a-divider>
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :loading="loading"
      :data-source="results"
      :pagination="false"
      :scroll="{ x: 120 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">影视搜索</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'title'">
          <a @click="gotoDetail(reocrd)">{{ record.title }} / {{ record.subtitle }}</a>
        </template>
        <template v-if="column.title === '操作'">
          <a @click="addWish(record)">添加</a>
          <a-divider type="vertical" />
        </template>
      </template>
    </a-table>
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
    const qs = {
      subscribe: '',
      keyword: ''
    };
    return {
      loading: false,
      subscribes: [],
      results: [],
      columns,
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
        const body = {
          douban: this.qs.subscribe,
          id: record.id,
          tag: this.qs.tag
        };
        await this.$api().subscribe.addWish(body);
        await this.$message().success('添加成功!');
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async gotoDetail (record) {
      window.open(record.link);
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
}
</style>
