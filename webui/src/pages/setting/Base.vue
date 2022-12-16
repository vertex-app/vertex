<template>
  <div style="font-size: 24px; font-weight: bold;">基础设置</div>
  <a-divider></a-divider>
  <div class="base-setting" >
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="setting"
        size="small"
        @finish="modify"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="User-Agent"
          name="userAgent"
          extra="所有网络请求所用的 User-Agent, 默认为 Vertex">
          <a-input size="small" v-model:value="setting.userAgent"/>
        </a-form-item>
        <a-form-item
          label="日志级别"
          name="loggerLevel"
          extra="选择日志记录的最低级别, 默认情况下建议仅选择 INFO, 重启后生效">
          <a-select size="small" v-model:value="setting.loggerLevel"  >
            <a-select-option value="info">INFO</a-select-option>
            <a-select-option value="debug">DEBUG</a-select-option>
            <a-select-option value="trace">TRACE</a-select-option>
            <a-select-option value="all">ALL</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="Telegram 代理"
          name="telegramProxy"
          extra="Nginx 或 Caddy 等软件反代 Telegram 域名 api.telegram.org 后的地址, 格式: http(s)://ip:port">
          <a-input size="small" v-model:value="setting.telegramProxy"/>
        </a-form-item>
        <a-form-item
          label="企业微信代理"
          name="wechatProxy"
          extra="Nginx 或 Caddy 等软件反代企业微信域名 qyapi.weixin.qq.com 后的地址, 格式: http(s)://ip:port/">
          <a-input size="small" v-model:value="setting.wechatProxy"/>
        </a-form-item>
        <a-form-item
          label="隐藏报错提示"
          extra="进入首页后不提示报错信息">
          <a-checkbox v-model:checked="setting.ignoreError">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="取消部分依赖检查"
          extra="取消部分依赖检查，请谨慎使用">
          <a-checkbox v-model:checked="setting.ignoreDependCheck">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">保存</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      setting: {}
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
    async get () {
      try {
        const s = (await this.$api().setting.get()).data;
        this.setting = {
          userAgent: s.userAgent,
          loggerLevel: s.loggerLevel,
          telegramProxy: s.telegramProxy,
          wechatProxy: s.wechatProxy,
          ignoreError: s.ignoreError,
          ignoreDependCheck: s.ignoreDependCheck
        };
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async modify () {
      try {
        await this.$api().setting.modify(this.setting);
        await this.$message().success('修改成功, 部分设置可能需要刷新页面生效.');
        this.get();
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    await this.get();
  }
};
</script>
<style scoped>
.base-setting {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: center;
}
</style>
