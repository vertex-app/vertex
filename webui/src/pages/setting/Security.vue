<template>
  <div style="font-size: 24px; font-weight: bold;">安全设置</div>
  <a-divider></a-divider>
  <div class="security-setting" >
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
          label="用户名"
          name="username"
          extra="登录所用用户名">
          <a-input size="small" v-model:value="setting.username"/>
        </a-form-item>
        <a-form-item
          label="密码"
          name="password"
          extra="登录所用密码, 留空为不修改">
          <a-input size="small" v-model:value="setting.password"/>
        </a-form-item>
        <a-form-item
          label="ApiKey"
          name="apiKey"
          extra="ApiKey 用于 Vertex 对外的接口请求鉴权, 第一次保存设置后生成">
          <a-input disabled size="small" v-model:value="setting.apiKey"/>
        </a-form-item>
        <a-form-item
          label="TMDB Api"
          name="tmdbApiKey"
          extra="The Movie Database Api Key, 用于从文件名提取影视剧名称, 请确保 Vertex 可以正常请求 api.themoviedb.org">
          <a-input size="small" v-model:value="setting.tmdbApiKey"/>
        </a-form-item>
        <a-form-item
          label="PanelKey"
          name="panelKey"
          extra="在 Vertex Panel 注册账号得到的 ApiKey, 用于与 Vertex Panel 通信">
          <a-input size="small" v-model:value="setting.panelKey"/>
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
          apiKey: s.apiKey,
          username: s.username,
          password: '',
          panelKey: s.panelKey,
          tmdbApiKey: s.tmdbApiKey
        };
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async modify () {
      try {
        const setting = { ...this.setting };
        if (setting.password) {
          setting.password = this.$md5(setting.password);
        }
        await this.$api().setting.modify(setting);
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
.security-setting {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: center;
}
</style>
