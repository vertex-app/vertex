<template>
  <div class="login">
    <div class="left-rect">
      <div class="logo">
        <img src="/assets/images/logo.svg"/>
      </div>
    </div>
    <div class="right-rect">
      <div class="logo">
        <img src="/assets/images/logo.svg"/>
      </div>
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="user"
        @finish="login"
        :labelCol="{ span: 6 }"
        :wrapperCol="{ span: 16 }"
        autocomplete="off"
        class="login-form login-layout">
        <div style="margin: 12px auto 6px; font-size: 32px; width: fit-content; font-weight: bold;">
          <span>Vertex</span>
        </div>
        <div style="margin: 6px auto 12px; font-size: 16px; width: fit-content; color: grey">
          <span>追剧刷流一体化工具</span>
        </div>
        <a-form-item
          label="用户名"
          name="username"
          :rules="[{ required: true, message: '用户名不能为空! ' }]">
          <a-input v-model:value="user.username"/>
        </a-form-item>
        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '密码不能为空! ' }]">
          <a-input-password v-model:value="user.password"/>
        </a-form-item>
        <a-form-item
          label="二步验证"
          name="otpPw">
          <a-input v-model:value="user.otpPw"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span: 22 } : { offset: 2, span: 20 }">
          <a-button type="primary" html-type="submit" block style="width: 100%; margin-top: 24px;">登录</a-button>
        </a-form-item>
        <a-form-item
          name="checked"
          :rules="[{ validator: async (rule, value) => { if (value) return; throw '需勾选我已阅读使用须知!' } }]"
          :wrapperCol="isMobile() ? { span: 22 } : { offset: 2, span: 20 }">
          <a-checkbox v-model:checked="user.checked">
            我已阅读
            <a color="warning" @click="openRegulation">《使用须知》</a>
            <br>
            并且知道遇到问题先去看
            <a color="warning" @click="openWiki">Wiki</a>
            <br>
            否则在交流群提问可能被
            <span style="color: red">禁言</span>
          </a-checkbox>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    const user = {
      username: '',
      password: '',
      otpPw: ''
    };
    return {
      user
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
    async login (ee) {
      try {
        await this.$api().user.login(this.user.username, this.user.password, this.user.otpPw);
        this.$goto('/index', this.$router);
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    openRegulation () {
      window.open('https://wiki.vertex-app.top/zh/misc/regulations');
    },
    openWiki () {
      window.open('https://wiki.vertex-app.top/zh/misc/faq');
    }
  }
};
</script>

<style scoped>
.login-form {
  width: min(100vw, 360px);
  border-radius: 4px;
  padding: 6px;
  margin: 0 auto;
  height: 460px;
  transition: all 0.5s;
}

.left-rect {
  float: left;
  transition: all 0.5s;
}

.right-rect {
  float: left;
}

.logo {
  transition: all 0.5s;
}

@media screen and (min-width:800px) {
  .login-form {
    margin-top: calc(50vh - 360px);
  }
  .left-rect {
    width: 300px;
    background: #e18dac;
    height: 100vh;
  }
  .right-rect {
    width: calc(100vw - 320px);
    height: 100vh;
  }
  .left-rect > .logo {
    margin: 0 auto;
    width: 180px;
    padding-top: calc(50vh - 180px);
    border-radius: 32px;
  }
  .right-rect > .logo {
    overflow: hidden;
    height: 0;
    margin: 0 auto;
    width: 160px;
    padding-top: 64px;
    border-radius: 32px;
  }
}

@media screen and (max-width:800px) {
  .left-rect {
    width: 0;
    background: #e18dac;
    height: 100vh;
    overflow: hidden;
  }
  .right-rect {
    width: 100vw;
    height: 100vh;
    transition: all 0.5s;
  }
  .left-rect > .logo {
    overflow: hidden;
    margin: 0 auto;
    width: 0;
    border-radius: 32px;
    padding-top: calc(50vh - 180px);
  }
  .right-rect > .logo {
    margin: 0 auto;
    width: 120px;
    padding-top: 6px;
    border-radius: 32px;
  }
}
</style>
