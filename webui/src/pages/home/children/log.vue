<template>
  <div class="site-settings">
    <div style="width: 100%">
      <el-select v-model="type" @change="getLog" placeholder="日志类型">
        <el-option label="info" value="info"></el-option>
        <el-option label="error" value="error"></el-option>
        <el-option label="debug" value="debug"></el-option>
      </el-select>
    </div>
    <el-input type="textarea" autosize v-model="log">
    </el-input>
  </div>
</template>

<script>
export default {
  data () {
    return {
      log: '',
      type: 'info'
    };
  },
  methods: {
    async getLog () {
      const res = await this.$axiosGet(`/api/log/get?type=${this.type}`);
      this.log = res ? '[202' + res.data.split('[202').reverse().join('[202') : '';
    }
  },
  mounted () {
    this.getLog();
  }
};
</script>

<style scoped>

</style>
