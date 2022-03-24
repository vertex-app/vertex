<template>
  <div class="site-mix" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="站点列表" name="site-list">
      </el-tab-pane>
      <el-tab-pane label="增长记录" name="site-data">
      </el-tab-pane>
    </el-tabs>
    <router-view style="height: calc(100vh - 156px); overflow: auto;"></router-view>
  </div>
</template>

<script>
export default {
  data () {
    return {
      activeName: 'site-list'
    };
  },
  methods: {
    handleTabsClick (param) {
      this.$goto('/site-mix/' + this.activeName, this.$router);
    }
  },
  async mounted () {
    this.activeName = this.$route.path.split('/').pop();
  }
};
</script>

<style scoped>
</style>
