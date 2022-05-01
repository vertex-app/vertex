<template>
  <div>
    <div class="radius-div" style="margin: 20px 0;">
      <el-form label-width="160px" style="width: fit-content; text-align: left; padding: 20px 0;" size="mini">
        <el-form-item label="Cookie">
          <el-input v-model="cookie" style="width: 350px;"></el-input>
        </el-form-item>
        <el-form-item label="二步验证码">
          <el-input v-model="otp" style="width: 350px;"></el-input>
        </el-form-item>
        <el-form-item size="small">
          <el-button type="primary" @click="doLogin">执行</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      cookie: '',
      otp: ''
    };
  },
  methods: {
    async doLogin () {
      const res = await this.$axiosPost('/api/setting/loginMTeam', {
        otp: this.otp,
        cookie: this.cookie
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
    }
  },
  mounted () {
  }
};
</script>

<style scoped>

</style>
