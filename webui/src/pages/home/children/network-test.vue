<template>
  <div>
    <div class="radius-div" style="margin: 20px 0;">
      <el-form label-width="160px" style="width: fit-content; text-align: left; padding: 20px 0;" size="mini">
        <el-form-item label="网络地址">
          <el-input v-model="address" style="width: 350px;"></el-input>
        </el-form-item>
        <el-form-item label="Cookie">
          <el-input v-model="cookie" style="width: 350px;"></el-input>
        </el-form-item>
        <el-form-item size="small">
          <el-button type="primary" @click="doTest">测试</el-button>
        </el-form-item>
      </el-form>
      <el-input type="textarea" autosize v-model="result">
      </el-input>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      address: '',
      cookie: '',
      result: ''
    };
  },
  methods: {
    async doTest () {
      const res = await this.$axiosPost('/api/setting/networkTest', {
        address: this.address,
        cookie: this.cookie
      });
      this.result = res ? res.data : '';
    }
  },
  mounted () {
  }
};
</script>

<style scoped>

</style>
