<template>
  <div class="login">
    <div class="login-main">
      <el-form ref="user" class="user-form" :model="user" size="mini" @keyup.enter.native="login">
        <el-form-item required label="用户名" prop="username">
          <el-input v-model="user.username"></el-input>
        </el-form-item>
        <el-form-item required label="密码" prop="password">
          <el-input v-model="user.password"></el-input>
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
