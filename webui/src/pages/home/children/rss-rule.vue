<template>
  <div class="rule">
    <div class="radius-div">
      <el-table
        :data="ruleList"
        :default-sort="{prop: 'alias'}"
        style="margin: 20px">
        <el-table-column
          prop="id"
          label="ID"
          width="100">
        </el-table-column>
        <el-table-column
          sortable
          prop="alias"
          label="别名">
        </el-table-column>
        <el-table-column
          label="操作"
          width="256">
          <template slot-scope="scope">
            <el-button
              type="primary"
              size="small"
              v-clipboard:copy="JSON.stringify(scope.row, null, 2)"
              v-clipboard:success="onCopy"
              v-clipboard:error="onError">
              复制
            </el-button>
            <el-button @click="modifyRule(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button @click="deleteRule(scope.row)" :disabled="scope.row.used" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="ruleCollapse">
        <el-collapse-item title="新增 | 编辑 Rss 规则" name="1">
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small">规则 ID: {{rule.id || '新增'}}</el-tag>
          </div>
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small" type="warning">以下条件必须全部符合, 才触发添加种子操作</el-tag>
          </div>
          <el-form ref="rule" class="rule-form" :model="rule" label-width="160px" size="mini">
            <el-form-item required label="别名" prop="alias">
              <el-input v-model="rule.alias" type="input"></el-input>
            </el-form-item>
            <el-form-item required label="类型" prop="type">
              <el-select v-model="rule.type" style="width: 144px" placeholder="类型">
                  <el-option label="普通" value="normal"></el-option>
                  <el-option label="JavaScript" value="javascript"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item v-if="rule.type === 'normal'" label="条件" prop="conditions">
              <el-table
                size="mini"
                :data="rule.conditions"
                style="width: 720px">
                <el-table-column
                  label="选项"
                  width="180">
                  <template slot-scope="scope">
                    <el-select v-model="scope.row.key" style="width: 160px" placeholder="选择选项">
                      <el-option v-for="item of conditionKeys" :key="item.key" :label="item.name" :value="item.key"></el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column
                  label="比较类型"
                  width="144">
                  <template slot-scope="scope">
                    <el-select v-model="scope.row.compareType" style="width: 120px" placeholder="比较类型">
                      <el-option label="等于" value="equals"></el-option>
                      <el-option label="大于" value="bigger"></el-option>
                      <el-option label="小于" value="smaller"></el-option>
                      <el-option label="包含" value="contain"></el-option>
                      <el-option label="不包含" value="notContain"></el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column
                  label="值">
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.value" placeholder="填写值"/>
                  </template>
                </el-table-column>
                <el-table-column
                  label="操作"
                  width="96">
                  <template slot-scope="scope">
                    <el-button @click="rule.conditions = rule.conditions.filter(item => item !== scope.row)" type="danger" size="small">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-button @click="rule.conditions.push({ ...condition })" type="primary" size="small">新增</el-button>
              <el-card style="margin: 12px 0; max-width: 640px" >
                说明: <br>
                01: Rss 规则的 包含 与 不包含 条件, 可以填写多个关键字, 需以半角逗号 , 为分割符<br>
                &nbsp;&nbsp;&nbsp;&nbsp;如 <el-tag>KEY,WORD</el-tag>, 表示包含 KEY 或者 WORD 两个关键词<br>
                02: 各条件间为 且 的关系<br>
                03. 种子大小: 单位为 字节 / Byte, 可以使用 * 做乘法运算<br>
              </el-card>
            </el-form-item>
            <el-form-item v-if="rule.type === 'javascript'" label="自定义代码">
              <el-input v-model="rule.code" type="textarea" :rows="20" style="width: 500px;"></el-input>
              <div><el-tag type="info">自定义 Rss 逻辑代码</el-tag></div>
            </el-form-item>
            <el-form-item size="small">
              <el-button type="primary" @click="handleRuleClick">新增 | 编辑</el-button>
              <el-button type="primary" @click="importRuleVisible = !importRuleVisible">导入</el-button>
              <el-button @click="clearRule">清空</el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
      <el-dialog title="导入规则" :visible.sync="importRuleVisible" width="80%">
        <el-form label-width="144px" size="mini" style="width: 80%;">
          <el-form-item label="规则">
            <el-input v-model="importRuleText" type="textarea" :rows="20" style="width: 500px;"></el-input>
          </el-form-item>
          <el-form-item size="mini">
            <el-button type="primary" @click="importRule">导入</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      rule: {},
      conditionKeys: [{
        name: '种子名称',
        key: 'name'
      }, {
        name: '种子大小',
        key: 'size'
      }],
      defaultRule: {
        conditions: [],
        code: '(torrent) => {\n' +
          '  return false;\n' +
          '}'
      },
      condition: {
        key: '',
        compareType: '',
        value: ''
      },
      ruleList: [],
      ruleCollapse: ['1'],
      importRuleVisible: false,
      importRuleText: ''
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
      this.rule.conditions = row.conditions.map(item => {
        return { ...item };
      });
    },
    async clearRule () {
      this.rule = { ...this.defaultRule };
      this.rule.conditions = [{ ...this.condition }];
      this.$refs.rule.resetFields();
    },
    async listRule () {
      const res = await this.$axiosGet('/api/rssRule/list');
      this.ruleList = res ? res.data : [];
    },
    onCopy () {
      this.$message.info('复制到剪贴板成功');
    },
    onError (e) {
      this.$message.error(e.message);
    },
    importRule () {
      this.clearRule();
      try {
        this.rule = {
          ...JSON.parse(this.importRuleText),
          id: undefined
        };
        this.importRuleVisible = false;
        this.importRuleText = '';
      } catch (e) {
        this.$message.error('输入内容有误');
      }
    }
  },
  async mounted () {
    this.rule = { ...this.defaultRule };
    this.rule.conditions = [{ ...this.condition }];
    this.$refs.rule.resetFields();
    this.listRule();
  }
};
</script>

<style scoped>
.rule-div {
  margin: 20px 0;
}

.collapse {
  margin: 20px;
}

.rule-form * {
  width: fit-content;
  text-align: left;
}
</style>
