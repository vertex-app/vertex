<template>
  <div class="site-mix" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="站点数据" name="site-database">
      </el-tab-pane>
    </el-tabs>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  data () {
    return {
      activeName: 'rss'
    };
  },
  methods: {
    handleTabsClick (param) {
      this.$goto('/site-mix/' + this.activeName, this.$router);
    }
  },
  async mounted () {
  }
};
</script>

<style scoped>
</style>
