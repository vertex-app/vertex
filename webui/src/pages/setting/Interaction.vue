<template>
  <div style="font-size: 24px; font-weight: bold;">交互设置</div>
  <a-divider></a-divider>
  <div class="interaction-setting" >
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
          label="微信 Token"
          name="wechatToken"
          extra="微信 Token, 在企业微信接收消息设置内获取">
          <a-input size="small" v-model:value="setting.wechatToken"/>
        </a-form-item>
        <a-form-item
          label="微信 AesKey"
          name="wechatAesKey"
          extra="微信 AesKey, 在企业微信接收消息设置内获取">
          <a-input size="small" v-model:value="setting.wechatAesKey"/>
        </a-form-item>
        <a-form-item
          label="交互方式"
          name="doubanPush"
          extra="微信内交互时使用的通知方式">
          <a-select size="small" v-model:value="setting.doubanPush"  >
            <a-select-option v-for="notification of notifications" :key="notification.id" v-model:value="notification.id">{{ notification.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="媒体服务通知"
          name="webhookPushTo"
          extra="Plex 等信息的通知方式">
          <a-select size="small" v-model:value="setting.webhookPushTo"  >
            <a-select-option v-for="notification of notifications" :key="notification.id" v-model:value="notification.id">{{ notification.alias }}</a-select-option>
          </a-select>
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
      setting: {},
      notifications: []
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
          wechatAesKey: s.wechatAesKey,
          wechatToken: s.wechatToken,
          doubanPush: s.doubanPush,
          webhookPushTo: s.webhookPushTo
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
    },
    async listNotification () {
      try {
        const res = await this.$api().notification.list();
        this.notifications = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    await this.get();
    this.listNotification();
  }
};
</script>
<style scoped>
.interaction-setting {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: center;
}
</style>
