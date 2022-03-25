<template>
  <div class="hit-and-run" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="种子聚合" name="torrent-mix">
      </el-tab-pane>
      <el-tab-pane label="种子历史" name="torrent-history">
      </el-tab-pane>
      <el-tab-pane label="Rss 任务" name="rss">
      </el-tab-pane>
      <el-tab-pane label="Rss 规则" name="rss-rule">
      </el-tab-pane>
      <el-tab-pane label="删种规则" name="delete-rule">
      </el-tab-pane>
      <el-tab-pane label="下载器" name="client">
      </el-tab-pane>
    </el-tabs>
    <router-view style="height: calc(100vh - 156px); overflow: auto;"></router-view>
  </div>
</template>

<script>
export default {
  data () {
    return {
      activeName: 'torrent-mix'
    };
  },
  methods: {
    handleTabsClick (param) {
      this.$goto('/hit-and-run/' + this.activeName, this.$router);
    }
  },
  async mounted () {
    this.activeName = this.$route.path.split('/').pop();
  }
};
</script>

<style scoped>
</style>
