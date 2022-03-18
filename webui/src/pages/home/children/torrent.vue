<template>
  <div class="torrent" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="种子聚合" name="torrent-mix">
      </el-tab-pane>
      <el-tab-pane label="种子历史" name="torrent-history">
      </el-tab-pane>
    </el-tabs>
    <router-view></router-view>
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
      this.$goto('/torrent/' + this.activeName, this.$router);
    }
  },
  async mounted () {
    this.activeName = this.$route.path.split('/').pop();
  }
};
</script>

<style scoped>
</style>
