<template>
  <div style="font-size: 24px; font-weight: bold;">日志</div>
  <a-divider></a-divider>
  <div class="log">
    <div style="text-align: left; margin: 24px">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        size="small"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="日志等级"
          name="type">
          <a-select size="small" v-model:value="type" @change="getLog">
            <a-select-option value="info">信息</a-select-option>
            <a-select-option value="binge">豆瓣</a-select-option>
            <a-select-option value="binge-debug">豆瓣调试</a-select-option>
            <a-select-option value="advanced">超级模式</a-select-option>
            <a-select-option value="advanced-debug">超级模式调试</a-select-option>
            <a-select-option value="watch">监控分类</a-select-option>
            <a-select-option value="watch-debug">监控分类调试</a-select-option>
            <a-select-option value="sc">定时脚本</a-select-option>
            <a-select-option value="sc-debug">定时脚本调试</a-select-option>
            <a-select-option value="error">错误</a-select-option>
            <a-select-option value="debug">调试</a-select-option>
            <a-select-option value="access">跟踪</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button size="small" type="primary" @click="getLog">查询</a-button>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <p style="color: red; font-weight: bold;">截图日志务必把版本: {{version.head}}/{{version.updateTime}} 带上, 并注意上方的日志等级以及日志的时间</p>
          <p style="color: red; font-weight: bold;">注意报错的 message / code / status 附近的内容</p>
          <p style="color: red; font-weight: bold;">偶尔报错请直接忽略, 周期性报错需要注意。</p>
        </a-form-item>
        <a-form-item
          label="日志">
          <a-textarea v-model:value="log" type="textarea" autoSize></a-textarea>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      type: 'error',
      log: '',
      version: {}
    };
  },
  methods: {
    isMobile () {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
      } else {
        return false;
      }
    },
    async getLog () {
      try {
        const res = await this.$api().log.get(this.type);
        this.log = res.data;
        this.log = res ? '[202' + res.data.split('[202').reverse().join('[202') : '';
        this.log = this.log.replace(new RegExp(`\\[${this.$moment().format('YYYY')}-`, 'g'), '[').replace(/\[[^\d]*? console\] \d*/g, '').replace(/\[202/g, '');
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    this.version = process.env.version;
    this.getLog();
  }
};
</script>
<style scoped>
.log {
  width: 100%;
  /*max-width: 1440px;*/
  margin: 0 auto;
}
</style>
