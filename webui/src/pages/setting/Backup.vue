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
          label="种子文件"
          extra="备份时是否备份种子文件, 如不备份, 恢复时将清空所有已有种子">
          <a-checkbox v-model:checked="setting.backupTorrent">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="备份">
          <a-button size="small" type="primary" @click="backupVertex">下载备份</a-button>
        </a-form-item>
        <a-form-item
          label="恢复">
          <a-upload
            :capture="null"
            :accept="null"
            action="/api/setting/restoreVertex"
            :showUploadList="true"
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
      setting: {
        backupTorrent: false
      }
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
      if (this.setting.backupTorrent) {
        window.open('/api/setting/backupVertex?bt=true');
      } else {
        window.open('/api/setting/backupVertex');
      }
    },
    async handleChange ({ file }) {
      if (file.status === 'done') {
        await this.$notification().open({
          message: '恢复备份成功',
          description: '恢复备份成功, 重启后生效',
          duration: 0
        });
      }
      if (file.status === 'error') {
        await this.$notification().open({
          message: '恢复备份失败',
          description: '恢复备份失败',
          duration: 0
        });
      }
    }
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
