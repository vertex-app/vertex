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
          <el-collapse-item title="新增 | 编辑 Rss 规则" name="1">
            <div style="width: fit-content; margin: 6px 0 12px 20px">
              <el-tag size="small">规则 ID: {{rule.id || '新增'}}</el-tag>
            </div>
            <div style="width: fit-content; margin: 6px 0 12px 20px">
              <el-tag size="small" type="warning">以下条件必须全部符合, 才触发添加种子操作, 留空为不启用选项</el-tag>
            </div>
            <el-form ref="rule" class="rule-form" :model="rule" label-width="160px" size="mini">
              <el-form-item required label="别名" prop="alias">
                <el-input v-model="rule.alias" type="input"></el-input>
              </el-form-item>
              <el-form-item label="大小大于">
                <el-input v-model="rule.minSize" type="number"></el-input>
                <div><el-tag type="info">种子大小需大于此值, 单位为 字节 (Byte)</el-tag></div>
              </el-form-item>
              <el-form-item label="大小小于">
                <el-input v-model="rule.maxSize" type="number"></el-input>
                <div><el-tag type="info">种子大小需小于此值, 单位为 字节 (Byte)</el-tag></div>
              </el-form-item>
              <el-form-item label="包含关键词">
                <el-input v-model="rule.includeKeys" type="textarea"></el-input>
                <div><el-tag type="info">种子标题需包含的关键词, 一行为一个关键词, 各个关键词间为 且 的关系, 即标题包含 所有 关键词时 才会 添加本种子</el-tag></div>
              </el-form-item>
              <el-form-item label="排除关键词">
                <el-input v-model="rule.excludeKeys" type="textarea"></el-input>
                <div><el-tag type="info">种子标题需排除的关键词, 一行为一个关键词, 各个关键词间为 且 的关系, 即标题包含 所有 关键词时 拒绝 添加本种子</el-tag></div>
              </el-form-item>
              <el-form-item label="正则表达式">
                <el-input v-model="rule.regExp" type="textarea"></el-input>
                <div><el-tag type="info">此选项需要用到 正则表达式 相关知识</el-tag></div>
                <div><el-tag type="info">种子标题符合的正则表达式, 不需要两侧的 /, 例: Time.*2160p.* , 表示添加标题包含 Time 与 2160p 两个关键词, 且 Time 在 2160p 之前的种子</el-tag></div>
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
          const url = '/api/rssRule/' + (this.rule.id ? 'modify' : 'add');
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
      const url = '/api/rssRule/delete';
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
      this.rule = { ...row };
    },
    async clearRule () {
      this.rule = { ...this.defaultRule };
      this.$refs.rule.resetFields();
    },
    async listRule () {
      const res = await this.$axiosGet('/api/rssRule/list');
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
