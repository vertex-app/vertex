<template>
  <div>
    <div class="radius-div">
      <div style="margin: 20px auto; padding: 20px 0; text-align: left; margin-left: 64px">
        <el-input type="textarea" style="width: 440px;" :rows="20" v-model="hosts">
        </el-input>
        <div style="margin-top: 32px;">
          <el-button size="mini" type="primary" @click="save">保存</el-button>
        </div>
        <div style="margin-top: 16px;">
          <el-button size="mini" type="primary" @click="_export">导出</el-button>
          <el-button size="mini" type="primary" @click="_import" style="margin-left: 36px;">导入</el-button>
        </div>
        <el-card style="margin: 12px 24px 12px 0;" >
          说明: <br>
          1. 输入框内容实时读取自文件 /etc/hosts <br>
          2. 保存是指将内容保存至 /etc/hosts <br>
          3. 导出是指将内容保存至 /etc/hosts 的内容复制至 vertex/data/hosts <br>
          4. 导入是指将内容保存至 vertex/data/hosts 的内容复制至 /etc/hosts <br>
          5. 内容格式同普通的 hosts <br>
          &nbsp;&nbsp;&nbsp;例: 127.0.0.1 localhost<br>
          6. 输入框结尾至少保留一个空行 <br>
        </el-card>
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
    async getHosts () {
      const res = await this.$axiosGet('/api/setting/getHosts');
      this.hosts = res?.data;
    },
    async save () {
      const res = await this.$axiosPost('/api/setting/save', {
        hosts: this.hosts
      });
      await this.$messageBox(res);
      this.getHosts();
    },
    async _export () {
      const res = await this.$axiosGet('/api/setting/export');
      await this.$messageBox(res);
      this.getHosts();
    },
    async _import () {
      const res = await this.$axiosGet('/api/setting/import');
      await this.$messageBox(res);
      this.getHosts();
    }
  },
  async mounted () {
    await this.getHosts();
  }
};
</script>

<style scoped>
.el-form-item {
  margin: 12px 0;
  margin-bottom: 0;
}
</style>
