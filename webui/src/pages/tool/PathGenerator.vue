<template>
  <div style="font-size: 24px; font-weight: bold;">路径生成器</div>
  <a-divider></a-divider>
  <div class="path-generator">
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="info"
        size="small"
        @finish="generate"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="下载器路径关系"
          name="downloader"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          extra="参照自己的容器设置填写, 下载器内路径的映射关系, 主机路径:下载器路径, 例 /volume1/downloads:/downloads; 如果是套件, 可以填写 /volume1/downloads:/volume1/downloads">
          <a-input size="small" v-model:value="info.downloader"/>
        </a-form-item>
        <a-form-item
          label="媒体服务器路径关系"
          name="mediaServer"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          extra="参照自己的容器设置填写, 媒体服务器路径关系, 主机路径:媒体库路径, 例 /volume1/downloads:/media; 如果是套件, 可以填写 /volume1/downloads:/volume1/downloads">
          <a-input size="small" v-model:value="info.mediaServer"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">执行</a-button>
        </a-form-item>
        <a-form-item
          label="结果">
          <a-input size="small" v-model:value="result"/>
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
    async generate () {
      const a = 1;
    }
  },
  async mounted () {
  }
};
</script>
<style scoped>
.path-generator {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
