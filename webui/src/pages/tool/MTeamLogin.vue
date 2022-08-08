<template>
  <div style="font-size: 24px; font-weight: bold;">登录 MTeam</div>
  <a-divider></a-divider>
  <div class="mteam">
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="mteam"
        size="small"
        @finish="doLogin"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="Cookie"
          name="cookie"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="mteam.cookie"/>
        </a-form-item>
        <a-form-item
          label="二步验证码"
          name="otp">
          <a-input size="small" v-model:value="mteam.otp"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">执行</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      mteam: {}
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
    async doLogin () {
      try {
        const res = await this.$api().setting.loginMTeam(this.mteam);
        await this.$message().success(res.message);
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
.mteam {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
