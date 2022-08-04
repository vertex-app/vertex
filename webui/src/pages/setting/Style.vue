<template>
  <div style="font-size: 24px; font-weight: bold;">主题设置</div>
  <a-divider></a-divider>
  <div class="style-setting" >
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
        class='style-setting-form'>
        <a-form-item
          label="主题色"
          name="theme"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-switch
            v-model:checked="setting.theme"
            checked-children="亮色"
            un-checked-children="暗色"
            checkedValue="light"
            unCheckedValue="dark"
          />
        </a-form-item>
        <a-form-item
          label="微信通知默认封面"
          name="wechatCover"
          extra="企业微信通知时使用的默认封面, 留空显示 Vertex Logo">
          <a-input size="small" v-model:value="setting.wechatCover"/>
        </a-form-item>
        <a-form-item
          label="Emby 通知封面"
          name="embyCover"
          extra="Emby 通知时使用的封面, 留空显示 Vertex Logo">
          <a-input size="small" v-model:value="setting.embyCover"/>
        </a-form-item>
        <a-form-item
          label="Plex 通知封面"
          name="plexCover"
          extra="Plex 通知时使用的封面, 留空显示 Vertex Logo">
          <a-input size="small" v-model:value="setting.plexCover"/>
        </a-form-item>
        <a-form-item
          label="Jellyfin 通知封面"
          name="jellyfinCover"
          extra="Jellyfin 通知时使用的封面, 留空显示 Vertex Logo">
          <a-input size="small" v-model:value="setting.jellyfinCover"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 20, offset: 4 }">
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
          theme: s.theme || 'dark',
          wechatCover: s.wechatCover,
          embyCover: s.embyCover,
          plexCover: s.plexCover,
          jellyfinCover: s.jellyfinCover
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
.style-setting {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: center;
}
</style>
