<template>
  <div>
    <div class="radius-div">
      <div style="margin: 20px auto; padding: 20px 0; text-align: left; margin-left: 64px">
        <el-input type="input" style="width: 440px;" v-model="proxy" placeholder="http://192.168.1.1:8080">
        </el-input>
        <div style="margin-top: 12px;"></div>
        <el-input type="textarea" style="width: 440px;" :rows="20" v-model="domains" placeholder="www.baidu.com">
        </el-input>
        <div style="margin-top: 32px;">
          <el-button size="mini" type="primary" @click="save">保存</el-button>
        </div>
        <el-card style="margin: 12px 24px 12px 0;" >
          说明: <br>
          1. http proxy 格式为 http://192.168.1.1:8080<br>
          2. domains 指走 http proxy 的域名列表, 一行一个<br>
          3. 域名需完全匹配, 例: www.baidu.com<br>
          3. 代理设置不支持绕过 Cloudflare 时使用<br>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      domains: '',
      proxy: ''
    };
  },
  methods: {
    async getProxy () {
      const res = await this.$axiosGet('/api/setting/getProxy');
      this.domains = (res ? res.data : '').domains || '';
      this.proxy = (res ? res.data : '').proxy || '';
    },
    async save () {
      const res = await this.$axiosPost('/api/setting/saveProxy', {
        domains: this.domains,
        proxy: this.proxy
      });
      await this.$messageBox(res);
      this.getProxy();
    }
  },
  async mounted () {
    await this.getProxy();
  }
};
</script>

<style scoped>
.el-form-item {
  margin: 12px 0;
  margin-bottom: 0;
}
</style>
