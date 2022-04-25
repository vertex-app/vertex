<template>
  <div class="radius-div" style="margin: 20px 0;">
    <div style="width: 100%; text-align: left; padding: 24px 0; border-radius: 8px;">
      <a style="padding-left: 24px">选择日志级别:</a>
      <el-select size="small" v-model="type" @change="getLog" placeholder="日志级别">
        <el-option label="信息" value="info"></el-option>
        <el-option label="豆瓣" value="binge"></el-option>
        <el-option label="豆瓣调试" value="binge-debug"></el-option>
        <el-option label="错误" value="error"></el-option>
        <el-option label="调试" value="debug"></el-option>
        <el-option label="跟踪" value="access"></el-option>
      </el-select>
      <el-button type="primary" size="small" @click="clearLogFiles">清空历史日志文件</el-button>
      <el-button type="primary" size="small" @click="getLog">刷新</el-button>
      <el-link style="color: red; margin-left: 24px;" @click="gotoFAQ()">常见问题</el-link>
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
    },
    async gotoFAQ () {
      window.open('https://lswl.in/2022/03/19/vertex-faq/');
    },
    async clearLogFiles () {
      const res = await this.$axiosGet('/api/log/clear');
      if (!res) {
        return;
      }
      await this.$messageBox(res);
    }
  },
  mounted () {
    this.getLog();
  }
};
</script>

<style scoped>

</style>
