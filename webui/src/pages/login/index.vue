<template>
  <div class="login">
    <div class="login-main">
      <div :style="`line-height: 0; height: 240px;`">
        <div style="margin: 96px">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0.4385022521018982 -0.000009216904800268821 101.5615005493164 99.98497772216797"><path d="M69.3 59.41l-9.89 9.89L51 77.73 30.46 98.26A6 6 0 0 1 22 89.83L42.56 69.3 51 60.88l9.9-9.9zM102 24.28a6 6 0 0 1-1.75 4.21L77.72 51l-8.42-8.44 22.5-22.5a6 6 0 0 1 10.2 4.22z" fill="#0059cc"></path><path d="M83.64 6a5.94 5.94 0 0 1-1.74 4.21L41.08 51l-8.42-8.42 9.9-9.89L51 24.24 73.48 1.75A6 6 0 0 1 83.64 6zM32.66 59.41L12.13 79.93a6 6 0 0 1-8.42-8.42L24.24 51z" fill="#00dac7"></path><path d="M51 24.24l-8.42 8.43-22.5-22.5A6 6 0 0 1 24.28 0a5.89 5.89 0 0 1 4.2 1.75zM98.25 79.93a5.94 5.94 0 0 1-8.42 0L51 41.09l8.42-8.42 9.9 9.89 8.4 8.44 20.53 20.51a6 6 0 0 1 0 8.42z" fill="#00baec"></path><path d="M51 60.88l-8.44 8.42L1.74 28.49a6 6 0 0 1 8.43-8.43l22.49 22.5L41.08 51zM79.93 98.26a6 6 0 0 1-8.42 0L51 77.73l8.42-8.43 20.51 20.53a6 6 0 0 1 0 8.43z" fill="#00abd8"></path></svg>
        </div>
      </div>
      <el-form ref="user" class="user-form" :model="user" size="mini" @keyup.enter.native="login">
        <el-form-item required label="用户名" prop="username">
          <el-input v-model="user.username"></el-input>
        </el-form-item>
        <el-form-item required label="密码" prop="password">
          <el-input v-model="user.password" type="password"></el-input>
        </el-form-item>
        <el-form-item size="small">
          <el-button @click="login" type="primary">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      user: {}
    };
  },
  methods: {
    async login () {
      this.$refs.user.validate(async (valid) => {
        if (valid) {
          const url = `/api/user/login?username=${this.user.username}&password=${this.$md5(this.user.password)}`;
          const res = await this.$axiosGet(url);
          if (!res) {
            return;
          }
          window.location.href = '/home';
        } else {
          return false;
        }
      });
    }
  }
};
</script>

<style scoped>
.login {
  text-align: center;
  padding-top: 60px;
}

.login-main {
  backdrop-filter: blur(4px);
  background: rgba(44,62,80,0.2);
  padding: 12px 24px;
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
