<template>
  <div class="binge-wathing" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="聚合搜索" name="search-mix">
      </el-tab-pane>
      <el-tab-pane label="选种规则" name="race-rule">
      </el-tab-pane>
      <el-tab-pane label="链接规则" name="link-rule">
      </el-tab-pane>
      <el-tab-pane label="豆瓣账号" name="douban">
      </el-tab-pane>
      <el-tab-pane label="任务历史" name="douban-history">
      </el-tab-pane>
    </el-tabs>
    <router-view style="height: calc(var(--vh, 1vh) * 100 - 156px); overflow: auto;"></router-view>
  </div>
</template>

<script>
export default {
  data () {
    return {
      activeName: 'search-mix'
    };
  },
  methods: {
    handleTabsClick () {
      this.$goto('/binge-watching/' + this.activeName, this.$router);
    }
  },
  async mounted () {
    this.activeName = this.$route.path.split('/').pop();
  }
};
</script>

<style scoped>
</style>
