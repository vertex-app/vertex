<template>
  <div class="global" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="全局设置" name="setting">
      </el-tab-pane>
      <el-tab-pane label="通知工具" name="push">
      </el-tab-pane>
      <el-tab-pane label="关于" name="about">
      </el-tab-pane>
    </el-tabs>
    <router-view style="height: calc(var(--vh, 1vh) * 100 - 156px); overflow: auto;"></router-view>
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
    this.activeName = this.$route.path.split('/').pop();
  }
};
</script>

<style scoped>
</style>
