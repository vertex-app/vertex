<template>
  <div class="home">
    <el-row
    type="flex"
    :gutter="32"
    justify="space-around"
    align="top"
    >
      <el-col :span="6">
        <el-card class="card">
          <div class="card-tag">当前版本</div>
          <div class="card-content">
            {{version.split('\n')[0]}}
            <br>
            {{version.split('\n')[1]}}
            <br>
            {{version.split('\n')[2]}}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="card">
          <div class="card-tag">文档中心</div>
          <div class="card-content">
            <el-link href="https://lswl.in/2022/01/14/vertex/" type="primary">介绍文档</el-link>
            <br>
            <el-link href="https://lswl.in/2022/01/14/vertex-newbie/" type="primary">新手教程</el-link>
            <br>
            <el-link href="https://lswl.in/2022/01/19/vertex-supported-sites/" type="primary">支持站点</el-link>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="card">
          <div class="card-tag">交流群</div>
          <div class="card-content">
            QQ Group: 852643057
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  data () {
    return {
      version: 'dev'
    };
  },
  mounted () {
    this.version = process.env.version || this.version;
  }
};
</script>

<style scoped>
.card {
  width: 320px;
}

.card-tag {
  max-width: 320px;
  margin-left: 16px;
  text-align: left;
  font-size: 18px;
}

.card-content {
  margin-top: 12px;
  text-align: left;
  margin-left: 16px;
  max-width: 300px;
}
</style>
