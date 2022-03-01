<template>
  <div class="global" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="全局设置" name="setting">
      </el-tab-pane>
      <el-tab-pane label="推送工具" name="push">
      </el-tab-pane>
      <el-tab-pane label="日志查询" name="log">
      </el-tab-pane>
    </el-tabs>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  data () {
    return {
      activeName: 'setting'
    };
  },
  methods: {
    handleTabsClick (param) {
      this.$goto('/global/' + this.activeName, this.$router);
    }
  },
  async mounted () {
  }
};
</script>

<style scoped>
</style>
