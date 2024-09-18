<template>
  <div style="font-size: 24px; font-weight: bold;">系统信息</div>
  <a-divider></a-divider>
  <div class="info">
    <a-descriptions
      title="版本信息"
      :column="{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }"
      >
      <a-descriptions-item label="主版本">{{ version.version }}</a-descriptions-item>
      <a-descriptions-item label="编译版本"><a @click="gotoVersion">{{ version.head }}</a></a-descriptions-item>
      <a-descriptions-item label="发布时间">{{ version.updateTime }}</a-descriptions-item>
      <a-descriptions-item label="更新信息">{{ version.commitInfo }}</a-descriptions-item>
    </a-descriptions>
    <a-divider></a-divider>
    <a-descriptions
      title="交流群组"
      :column="{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }"
      >
      <a-descriptions-item label="Telegram 频道"><a @click="gotoChannel">前往</a></a-descriptions-item>
      <a-descriptions-item label="Telegram 群组"><a @click="gotoGroup">前往</a></a-descriptions-item>
      <a-descriptions-item label="交流群">852643057</a-descriptions-item>
    </a-descriptions>
    <a-divider></a-divider>
    <a-descriptions
      title="开源代码"
      :column="{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }"
      >
      <a-descriptions-item label="开源代码"><a @click="gotoGithub">GITHUB</a></a-descriptions-item>
    </a-descriptions>
    <a-divider></a-divider>
    <a-descriptions
      title="使用说明"
      :column="{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }"
      >
      <a-descriptions-item label="Wiki"><a @click="gotoWiki">Wiki</a></a-descriptions-item>
    </a-descriptions>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold;">打赏，如果你觉得这个项目对你有帮助，可以对我打赏，感谢！</div>
    <img style="max-height: 320px; max-width: calc(100vw - 32px); margin: 0 auto;" src="https://lswl.in/assets/images/alipay_qrcode.png"/>
  </div>
</template>
<script>
export default {
  data () {
    return {
      version: {},
      runInfo: {}
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
    async getRunInfo () {
      try {
        const res = await this.$api().setting.getRunInfo();
        this.runInfo = res.data;
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async gotoChannel () {
      window.open('https://t.me/lswl_vertex');
    },
    async gotoGroup () {
      window.open('https://t.me/group_vertex');
    },
    async gotoWiki () {
      window.open('https://wiki.vertex-app.top');
    },
    async gotoVersion () {
      window.open('https://lswl.in/2022/01/14/vertex-changelog');
    },
    async gotoGithub () {
      window.open('https://github.com/vertex-app/Vertex');
    },
    async gotoGitlab () {
      window.open('https://gitlab.lswl.in/lswl/vertex');
    }
  },
  async mounted () {
    this.getRunInfo();
    this.version = process.env.version;
  }
};
</script>
<style scoped>
.info {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
