<template>
  <div class="login">
    <div class="login-main">
      <div :style="`line-height: 0; height: 240px;`">
        <div style="margin: 96px">
          <img src="/assets/images/logo.svg"/>
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
          window.location.href = '/global/about';
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
