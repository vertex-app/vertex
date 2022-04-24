
<template>
  <div class="point" style="color: #dde6f9">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabsClick">
      <el-tab-pane label="下载器" name="client">
      </el-tab-pane>
      <el-tab-pane label="服务器" name="server">
      </el-tab-pane>
    </el-tabs>
    <router-view style="height: calc(var(--vh, 1vh) * 100 - 156px); overflow: auto;"></router-view>
  </div>
</template>

<script>
export default {
  data () {
    return {
      activeName: 'client'
    };
  },
  methods: {
    handleTabsClick (param) {
      this.$goto('/point/' + this.activeName, this.$router);
    }
  },
  async mounted () {
    this.activeName = this.$route.path.split('/').pop();
  }
};
</script>

<style scoped>
</style>
