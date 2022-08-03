<template>
  <div style="font-size: 24px; font-weight: bold;">修改 HOSTS</div>
  <a-divider></a-divider>
  <div class="hosts">
    <div style="text-align: left; ">
      <a-textarea  v-model:value="hosts" type="textarea" :rows="10"></a-textarea>
      <div style="margin-top: 16px;">
        <a-button type="primary" @click="save">保存</a-button>
      </div>
      <div style="margin-top: 16px;">
        <a-button size="small" type="primary" @click="_export">导出</a-button>
        <a-button size="small" type="primary" style="margin-left: 12px;" @click="_import">导入</a-button>
      </div>
      <div style="margin-top: 32px;">
          说明: <br>
          1. 输入框内容实时读取自文件 /etc/hosts <br>
          2. 保存是指将内容保存至 /etc/hosts <br>
          3. 导出是指将内容保存至 /etc/hosts 的内容复制至 vertex/data/hosts <br>
          4. 导入是指将内容保存至 vertex/data/hosts 的内容复制至 /etc/hosts <br>
          5. 内容格式同普通的 hosts <br>
          &nbsp;&nbsp;&nbsp;例: 127.0.0.1 localhost<br>
          6. 输入框结尾至少保留一个空行 <br>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      hosts: ''
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
    async getHosts () {
      try {
        const res = await this.$api().setting.getHosts();
        this.hosts = res.data;
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async save () {
      try {
        await this.$api().setting.save({ hosts: this.hosts });
        await this.$message().success('保存成功');
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async _export () {
      try {
        await this.$api().setting.export();
        await this.$message().success('导出成功');
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async _import () {
      try {
        await this.$api().setting.import();
        await this.$message().success('导入成功');
        this.getHosts();
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    this.getHosts();
  }
};
</script>
<style scoped>
.hosts {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
