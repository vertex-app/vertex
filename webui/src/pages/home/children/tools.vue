<template>
  <div class="site-mix" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="软链接" name="link">
      </el-tab-pane>
      <el-tab-pane label="MT登录" name="login-mteam">
      </el-tab-pane>
    </el-tabs>
    <router-view style="height: calc(100vh - 156px); overflow: auto;"></router-view>
  </div>
</template>

<script>
export default {
  data () {
    return {
      activeName: 'link'
    };
  },
  methods: {
    handleTabsClick (param) {
      this.$goto('/tools/' + this.activeName, this.$router);
    }
  },
  async mounted () {
    this.activeName = this.$route.path.split('/').pop();
  }
};
</script>

<style scoped>
</style>
