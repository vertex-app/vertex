<template>
  <div style="font-size: 24px; font-weight: bold;">路径替换规则生成器</div>
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
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-alert message="填写提示" type="info" >
            <template #description>
              以下路径均是针对影视资源文件本身
            </template>
          </a-alert>
        </a-form-item>
        <a-form-item
          label="模式"
          name="type"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="info.type"  >
            <a-select-option value="soft">软链接</a-select-option>
            <a-select-option value="hard">硬链接</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="下载器路径关系"
          name="downloader"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          extra="参照自己的容器设置填写, 下载器内路径的映射关系, 主机路径:下载器路径, 例 /volume1/downloads:/downloads; 如果是套件, 可以填写 /volume1/downloads:/volume1/downloads">
          <a-input size="small" v-model:value="info.downloader"/>
        </a-form-item>
        <a-form-item
          v-if="info.type === 'soft'"
          label="媒体服务器路径关系"
          name="mediaServer"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          extra="参照自己的容器设置填写, 媒体服务器路径关系, 主机路径:媒体库路径, 例 /volume1/downloads:/media; 如果是套件, 可以填写 /volume1/downloads:/volume1/downloads">
          <a-input size="small" v-model:value="info.mediaServer"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin: 12px 0;">执行</a-button>
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
        type: 'soft',
        downloader: '',
        mediaServer: ''
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
      // /Data/downloads:/dls
      // /Data:/movie
      // /dsl##/movie/downloads

      // /Data:/data
      // /Data/downloads:/movie
      // /data/downloads##/movie
      const { downloader, mediaServer, type } = this.info;
      if (type === 'hard') {
        const downloaderPrefix = downloader.split(':')[0];
        const downloaderSuffix = downloader.split(':')[1];
        if (!downloaderSuffix) {
          this.result = '填写内容格式有误, 请检查后重新填写';
          return;
        }
        this.result = `${downloaderSuffix}##${downloaderPrefix}`;
        return;
      }
      const downloaderPrefix = downloader.split(':')[0];
      const downloaderSuffix = downloader.split(':')[1];
      const mediaServerPrefix = mediaServer.split(':')[0];
      const mediaServerSuffix = mediaServer.split(':')[1];
      if (!downloaderSuffix || !mediaServerSuffix) {
        this.result = '填写内容格式有误, 请检查后重新填写';
        return;
      }
      if (downloaderPrefix.indexOf(mediaServerPrefix) !== 0 && mediaServerPrefix.indexOf(downloaderPrefix) !== 0) {
        this.result = `${downloaderPrefix} 与 ${mediaServerPrefix} 应该存在包含或被包含关系, 请检查所填写内容`;
        return;
      }
      if (downloaderPrefix.indexOf(mediaServerPrefix) === 0) {
        this.result = `${downloaderSuffix}##${mediaServerSuffix}${downloaderPrefix.replace(mediaServerPrefix, '')}`;
      }
      if (mediaServerPrefix.indexOf(downloaderPrefix) === 0) {
        this.result = `${downloaderSuffix}${mediaServerPrefix.replace(downloaderPrefix, '')}##${mediaServerSuffix}`;
      }
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
