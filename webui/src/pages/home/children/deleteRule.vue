<template>
  <div class="rule">
    <div class="rule-div">
      <el-table
        :data="ruleList"
        stripe
        style="width: 100%">
        <el-table-column
          prop="id"
          label="ID"
          width="100">
        </el-table-column>
        <el-table-column
          prop="alias"
          label="别名">
        </el-table-column>
        <el-table-column
          label="操作"
          width="200">
          <template slot-scope="scope">
            <el-button @click="modifyRule(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button @click="deleteRule(scope.row)" :disabled="scope.row.used" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="collapse-div">
        <el-collapse  class="collapse" v-model="ruleCollapse">
          <el-collapse-item title="新增 | 编辑 删种规则" name="1">
            <div style="width: fit-content; margin: 6px 0 12px 20px">
              <el-tag size="small">规则 ID: {{rule.id || '新增'}}</el-tag>
            </div>
            <div style="width: fit-content; margin: 6px 0 12px 20px">
              <el-tag size="small" type="warning">以下条件必须全部符合, 才触发删除种子操作, 留空为不启用选项, 优先删除已经完成时间早的种子, 若种子未完成, 则优先删除添加早的种子</el-tag>
            </div>
            <el-form ref="rule" class="rule-form" :model="rule" label-width="160px" size="mini">
              <el-form-item required label="别名" prop="alias">
                <el-input v-model="rule.alias" type="input"></el-input>
              </el-form-item>
              <el-form-item label="上传速度小于">
                <el-input v-model="rule.minUploadSpeed" type="number"></el-input>
                <div><el-tag type="info">种子上传速度, 仅在种子为 做种 状态或与 下载速度小于 选项一起使用时生效, 单位为 字节 (Byte)</el-tag></div>
              </el-form-item>
              <el-form-item label="下载速度大于">
                <el-input v-model="rule.maxDownloadSpeed" type="number"></el-input>
                <div><el-tag type="info">种子下载速度, 仅在与上传速度小于一起使用时生效, 单位为 字节 (Byte)</el-tag></div>
              </el-form-item>
              <el-form-item label="下载速度小于">
                <el-input v-model="rule.minDownloadSpeed" type="number"></el-input>
                <div><el-tag type="info">种子下载速度, 仅在与上传速度小于一起使用时生效, 单位为 字节 (Byte)</el-tag></div>
              </el-form-item>
              <el-form-item label="做种时间大于">
                <el-input v-model="rule.maxSeedTime" type="number"></el-input>
                <div><el-tag type="info">种子做种时间, 单位为 秒</el-tag></div>
              </el-form-item>
              <el-form-item label="下载时间大于">
                <el-input v-model="rule.maxLeechTime" type="number"></el-input>
                <div><el-tag type="info">种子下载时间, 单位为 秒</el-tag></div>
              </el-form-item>
              <el-form-item label="硬盘空间小于">
                <el-input v-model="rule.maxFreeSpace" type="number"></el-input>
                <div><el-tag type="info">硬盘空间 (读取自客户端), 仅对 做种 状态的种子生效, 单位为 字节 (Byte)</el-tag></div>
              </el-form-item>
              <el-form-item label="空间占用大于">
                <el-input v-model="rule.maxUsedSpace" type="number"></el-input>
                <div><el-tag type="info">占用空间 (读取客户端内种子完成量的和)</el-tag></div>
              </el-form-item>
              <el-form-item label="分享率大于">
                <el-input v-model="rule.maxRatio" type="number"></el-input>
                <div><el-tag type="info">分享率, 仅对 做种 状态的种子生效, 可以使用小数</el-tag></div>
              </el-form-item>
              <el-form-item label="可用性大于">
                <el-input v-model="rule.maxAvailability" type="number"></el-input>
                <div><el-tag type="info">可用性 - 近似于做种数 ( qb 4.1.9 为做种数 ), 仅对 下载 状态的种子生效, 可以使用小数</el-tag></div>
              </el-form-item>
              <el-form-item label="分类">
                <el-input v-model="rule.category" type="textarea"></el-input>
                <div><el-tag type="info">一行一个分类, 只会删除在分类列表内的种子</el-tag></div>
              </el-form-item>
              <el-form-item label="排除分类">
                <el-input v-model="rule.excludeCategory" type="textarea"></el-input>
                <div><el-tag type="info">一行一个分类, 在分类列表内的种子不会被删除</el-tag></div>
              </el-form-item>
              <el-form-item size="small">
                <el-button type="primary" @click="handleRuleClick">新增 | 编辑</el-button>
                <el-button @click="clearRule">清空</el-button>
              </el-form-item>
            </el-form>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      rule: {},
      defaultRule: {},
      ruleList: [],
      ruleCollapse: ['1']
    };
  },
  methods: {
    async handleRuleClick () {
      this.$refs.rule.validate(async (valid) => {
        if (valid) {
          const url = '/api/deleteRule/' + (this.rule.id ? 'modify' : 'add');
          const res = await this.$axiosPost(url, this.rule);
          if (!res) {
            return;
          }
          await this.$messageBox(res);
          this.listRule();
          this.clearRule();
        } else {
          return false;
        }
      });
    },
    async deleteRule (row) {
      const url = '/api/deleteRule/delete';
      const res = await this.$axiosPost(url, {
        id: row.id
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listRule();
      this.clearRule();
    },
    async modifyRule (row) {
      this.ruleCollapse = ['1'];
      this.rule = row;
    },
    async clearRule () {
      this.rule = { ...this.defaultRule };
      this.$refs.rule.resetFields();
    },
    async listRule () {
      const res = await this.$axiosGet('/api/deleteRule/list');
      this.ruleList = res ? res.data : [];
    }
  },
  async mounted () {
    this.rule = { ...this.defaultRule };
    this.$refs.rule.resetFields();
    this.listRule();
  }
};
</script>

<style scoped>
.rule-div {
  margin: 20px 0;
}

.collapse-div {
  border-radius: 8px;
  background: #FFFFFF;
}

.collapse {
  margin: 20px;
}

.rule-form * {
  width: fit-content;
  text-align: left;
}
</style>
