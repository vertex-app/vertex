<template>
  <div class="binge-wathing" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="自动追剧" name="auto-race">
      </el-tab-pane>
      <el-tab-pane label="聚合搜索" name="search-mix">
      </el-tab-pane>
    </el-tabs>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  data () {
    return {
      activeName: 'auto-race'
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
