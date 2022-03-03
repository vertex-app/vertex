<template>
  <div class="binge-wathing" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="聚合搜索" name="search-mix">
      </el-tab-pane>
      <el-tab-pane label="自动追剧" name="auto-race">
      </el-tab-pane>
      <el-tab-pane label="豆瓣账号" name="douban">
      </el-tab-pane>
      <el-tab-pane label="选种规则" name="race-rule">
      </el-tab-pane>
    </el-tabs>
    <router-view style="height: calc(100vh - 156px); overflow: auto;"></router-view>
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
  }
};
</script>

<style scoped>
</style>
