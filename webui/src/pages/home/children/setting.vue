<template>
  <div class="settings">
    <div class="radius-div">
      <el-form ref="setting" class="setting-form" :model="setting" label-width="160px" size="mini">
        <div style="top: 24px; padding-left: 32px; font-size: 24px">全局设置</div>
        <el-divider></el-divider>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="setting.username"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="setting.password"></el-input>
        </el-form-item>
        <el-form-item label="背景图片" prop="background">
          <el-input v-model="setting.background" style="width: 500px;"></el-input>
          <div><el-tag type="info">图片外链</el-tag></div>
        </el-form-item>
        <el-form-item label="Telegram 代理" prop="proxyPass">
          <el-input disabled v-model="setting.proxyPass"></el-input>
        </el-form-item>
        <el-form-item size="small">
          <el-button type="primary" @click="modifySetting">确认修改</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      setting: {},
      originSetting: {}
    };
  },
  methods: {
    async getSetting () {
      const res = await this.$axiosGet('/api/setting/get');
      this.setting = res.data || this.setting;
      this.originSetting = { ...this.setting };
    },
    async modifySetting () {
      const url = '/api/setting/modify';
      if (this.setting.password !== this.originSetting.password) {
        this.setting.password = this.$md5(this.setting.password);
      }
      const res = await this.$axiosPost(url, this.setting);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.getSetting();
    }
  },
  mounted () {
    this.getSetting();
  }
};
</script>

<style scoped>
.radius-div {
  text-align: left;
  border-radius: 8px;
  background: #FFFFFF;
}

.setting-form {
  padding: 20px;
}

.setting-form * {
  width: fit-content;
  text-align: left;
}
</style>
