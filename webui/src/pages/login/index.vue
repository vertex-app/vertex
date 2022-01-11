<template>
  <div class="login">
    <div class="login-main">
      <div class="inputs">
        <el-input v-model="username" size="small" placeholder="用户名"></el-input>
        <el-input v-model="password" size="small" placeholder="密码" show-password></el-input>
      </div>
      <el-button type="primary" @click="login">登录</el-button>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      username: '',
      password: ''
    };
  },
  methods: {
    async login () {
      const res = await this.$axiosGet(`/api/user/login?username=${this.username}&password=${this.$md5(this.password)}`);
      if (!res) {
        return;
      }
      window.location.href = '/home';
    }
  }
};
</script>

<style scoped>
.login {
  text-align: center;
  color: #2c3e50;
  padding-top: 60px;
}

.login-main {
  padding: 24px 0;
  width: 350px;
  margin: 0 auto;
  border-radius: 8px;
}

.inputs {
  width: 300px;
  margin: 0 auto;
}

.inputs > *{
  margin: 6px auto;
}

</style>
