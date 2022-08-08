<template>
  <div style="font-size: 24px; font-weight: bold;">网络测试</div>
  <a-divider></a-divider>
  <div class="network-test">
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="info"
        size="small"
        @finish="doTest"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="地址"
          name="address"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="info.address"/>
        </a-form-item>
        <a-form-item
          label="Cookie"
          name="cookie">
          <a-input size="small" v-model:value="info.cookie"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">执行</a-button>
        </a-form-item>
        <a-form-item
          label="结果">
          <a-textarea v-model:value="result" type="textarea" :rows="20"></a-textarea>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      info: {
        cookie: ''
      },
      result: ''
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
    async doTest () {
      try {
        const res = await this.$api().setting.networkTest(this.info);
        this.result = res.data;
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
  }
};
</script>
<style scoped>
.network-test {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
