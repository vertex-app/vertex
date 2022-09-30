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
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="主题"
          name="theme"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-radio-group v-model:value="setting.theme" name="theme">
            <a-radio value="light">亮色</a-radio>
            <a-radio value="dark">暗色</a-radio>
            <a-radio value="follow">跟随系统</a-radio>
            <a-radio value="cyber">赛博</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item
          v-if="setting.theme === 'cyber'"
          label="背景图片"
          name="background"
          extra="背景图片链接">
          <a-input size="small" v-model:value="setting.background"/>
        </a-form-item>
        <a-form-item
          label="通知默认封面"
          name="wechatCover"
          extra="通知时使用的默认封面, 留空显示 Vertex Logo">
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
          label="首页显示内容"
          name="dashboardContent"
          extra="选择首页数据展示">
          <a-checkbox-group style="width: 100%;" v-model:value="setting.dashboardContent">
            <a-row>
              <a-col v-for="type of contentType" :span="8" :key="type.key">
                <a-checkbox v-model:value="type.key">{{ type.text }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
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
      setting: {
        dashboardContent: []
      },
      contentType: [
        {
          key: 'downloader',
          text: '客户端'
        }, {
          key: 'server',
          text: '服务器'
        }, {
          key: 'tracker',
          text: 'Tracker 统计'
        }
      ]
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
          theme: s.theme || 'follow',
          background: s.background,
          wechatCover: s.wechatCover,
          embyCover: s.embyCover,
          plexCover: s.plexCover,
          jellyfinCover: s.jellyfinCover,
          dashboardContent: s.dashboardContent || []
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
