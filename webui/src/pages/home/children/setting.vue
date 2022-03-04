<template>
  <div class="settings">
    <div class="radius-div">
      <el-form ref="setting" class="setting-form" :model="setting" label-width="160px" size="mini">
        <div style="top: 24px; padding-left: 32px; font-size: 24px; color: #606266">全局设置</div>
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
        <el-form-item label="数据目录路径" prop="dataPath">
          <el-input v-model="setting.dataPath" style="width: 500px;"></el-input>
          <div><el-tag type="warning">数据目录路径, Docker 安装无需修改</el-tag></div>
        </el-form-item>
        <el-form-item label="ApiKey" prop="apiKey">
          <el-input v-model="setting.apiKey" disabled style="width: 500px;"></el-input>
          <div><el-tag type="warning">ApiKey 用于请求接口, 第一次保存全局设置后生成</el-tag></div>
        </el-form-item>
        <el-form-item label="媒体服务通知" prop="webhookPushTo">
          <el-select v-model="setting.webhookPushTo" placeholder="请选择 通知方式">
            <el-option v-for="push of pushList" :key="push.id" :label="push.alias" :value="push.id"></el-option>
          </el-select>
          <div><el-tag type="info">通知方式, 用于推送信息, 在推送工具页面创建</el-tag></div>
        </el-form-item>
        <el-form-item label="User-Agent" prop="userAgent">
          <el-input v-model="setting.userAgent" style="width: 500px;"></el-input>
          <div><el-tag type="info">所有网络请求所用的 User-Agent, 默认为 'Vertex'</el-tag></div>
        </el-form-item>
        <el-form-item label="日志级别" prop="loggerLevel">
          <el-select v-model="setting.loggerLevel" style="width: 144px" placeholder="日志级别">
            <el-option label="INFO" value="info"></el-option>
            <el-option label="DEBUG" value="debug"></el-option>
            <el-option label="ALL" value="all"></el-option>
          </el-select>
          <div><el-tag type="info">选择日志记录的最低级别, 默认情况下建议仅选择 INFO, 重启后生效</el-tag></div>
        </el-form-item>
        <el-form-item label="Telegram 代理" prop="telegramProxy">
          <el-input v-model="setting.telegramProxy"></el-input>
          <div><el-tag type="info">用于 Vertex 环境不方便访问 Telegram 的情况</el-tag></div>
        </el-form-item>
        <el-form-item size="small">
          <el-button type="primary" @click="modifySetting">确认修改</el-button>
        </el-form-item>
      </el-form>
      <el-divider/>
      <el-form class="setting-form" label-width="160px" size="mini">
        <div style="top: 24px; padding-left: 32px; font-size: 24px; color: #606266">备份与恢复</div>
        <el-divider></el-divider>
        <el-form-item size="small" label="备份">
          <el-button type="primary" @click="backupVertex">下载备份</el-button>
        </el-form-item>
        <el-form-item size="small" label="恢复">
          <el-upload
            :auto-upload="true"
            action="/api/setting/restoreVertex"
            :on-success="handleSuccess">
            <el-button size="small" type="primary">点击选择文件</el-button>
          </el-upload>
          <div><el-tag type="danger">请务必上传由 Vertex 生成的备份文件, 若上传其它文件, 将导致 Vertex 启动失败。</el-tag></div>
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
      originSetting: {},
      pushList: []
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
    },
    async backupVertex () {
      window.open('/api/setting/backupVertex');
    },
    async listPush () {
      const res = await this.$axiosGet('/api/push/list');
      this.pushList = res ? res.data : [];
    },
    async handleSuccess (responce) {
      await this.$messageBox(responce);
    }
  },
  mounted () {
    this.getSetting();
    this.listPush();
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
  margin: 20px;
}

.setting-form * {
  width: fit-content;
  text-align: left;
}
</style>
