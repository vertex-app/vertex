<template>
  <div>
    <div id="wish-detail" style="height: calc(100% - 20px);">
      <div id="wish-detail-container" style="margin: 20px auto; height: 100%; border-radius: 16px;">
        <div>
          ojbk!
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      wish: {}
    };
  },
  methods: {
    async getWish () {
      const url = `/api/douban/getWish?doubanId=${this.doubanId}&wishId=${this.wishId}`;
      const res = await this.$axiosGet(url);
      this.wish = (res ? res.data : '');
      document.getElementById('wish-detail').setAttribute('style', `background: url(${this.wish.poster}); background-position-x: center; background-position-y: center; background-size: cover; height: calc(100% - 20px); border-radius: 16px;`);
      document.getElementById('wish-detail-container').setAttribute('style', 'background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); margin: 20px auto; height: 100%; border-radius: 16px;');
    }
  },
  async mounted () {
    this.doubanId = this.$route.params.doubanId;
    this.wishId = this.$route.params.wishId;
    if (!this.doubanId || !this.wishId) {
      await this.$message.error('当前页面需要从想看列表页进入!');
      return;
    }
    await this.getWish();
  },
  beforeDestroy () {
    // document.getElementById('wish-detail').removeAttribute('style');
    // document.getElementById('wish-detail-container').removeAttribute('style');
  }
};
</script>

<style scoped>
.filter-form {
  margin: 20px 0;
  padding-top: 20px;
}

.table-expand .el-form-item {
  margin-bottom: 0;
}

.table-expand {
  width: fit-content;
  text-align: left;
}

.table-expand label {
  width: 90px;
  color: #99a9bf;
}

.tag-margin {
  margin: 0 4px;
}

.radius-div {
  border-radius: 8px;
  background: rgba(255,255,255, 0.3);
  backdrop-filter: blur(4px);
}
</style>
