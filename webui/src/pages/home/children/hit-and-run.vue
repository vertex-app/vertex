<template>
  <div class="hit-and-run" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="Rss" name="rss">
      </el-tab-pane>
      <el-tab-pane label="Rss 规则" name="rss-rule">
      </el-tab-pane>
      <el-tab-pane label="删种规则" name="delete-rule">
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
      this.$goto('/hit-and-run/' + this.activeName, this.$router);
    }
  },
  async mounted () {
  }
};
</script>

<style scoped>
</style>
