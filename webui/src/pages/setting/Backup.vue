<template>
  <div style="font-size: 24px; font-weight: bold;">备份还原</div>
  <a-divider></a-divider>
  <div class="backup" >
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        size="small"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="备份">
          <a-button size="small" type="primary" @click="backupVertex">下载备份</a-button>
        </a-form-item>
        <a-form-item
          label="恢复">
          <a-upload
            action="/api/setting/restoreVertex"
            :showUploadList="false"
            @change="handleChange">
            <a-button
              size="small"
              type="primary"
              danger>
              点击选择文件
            </a-button>
          </a-upload>
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
    async backupVertex () {
      window.open('/api/setting/backupVertex');
    },
    async handleChange ({ file }) {
      if (file.status === 'done') {
        await this.$message().success('恢复备份成功, 重启后生效');
      }
      if (file.status === 'error') {
        await this.$message().error('恢复备份失败, 请稍后重试');
      }
    }
  },
  async mounted () {
    await this.get();
  }
};
</script>
<style scoped>
.backup {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: center;
}
</style>
