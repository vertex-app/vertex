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
          label="别名"
          width="144">
        </el-table-column>
        <el-table-column
          sortable
          prop="server"
          label="服务器">
          <template slot-scope="scope">
            <el-tag>{{ (serverList.filter(item => item.id === scope.row.server)[0] || {}).alias }}</el-tag>
          </template>
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
            <el-button @click="linkRule(scope.row)" :disabled="scope.row.used" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="ruleCollapse">
        <el-collapse-item title="新增 | 编辑 链接规则" name="1">
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small">规则 ID: {{rule.id || '新增'}}</el-tag>
          </div>
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="" type="warning">链接规则较为复杂, 需要阅读文档后再行填写 => <el-link style="line-height: 14px;" @click="gotoDocument">文档</el-link></el-tag>
          </div>
          <el-form ref="rule" class="rule-form" :model="rule" label-width="160px" size="mini">
            <el-form-item required label="别名" prop="alias">
              <el-input v-model="rule.alias" type="input"></el-input>
            </el-form-item>
            <el-form-item required label="服务器" prop="server">
              <el-select v-model="rule.server" placeholder="服务器">
                <el-option v-for="server of serverList" :key="server.id" :disabled="!server.enable" :label="server.alias" :value="server.id">{{server.alias}}</el-option>
              </el-select>
              <div><el-tag type="info">选择服务器, 仅可选择已经启用的服务器</el-tag></div>
            </el-form-item>
            <el-form-item required label="链接目标目录替换" prop="targetPath">
              <el-input v-model="rule.targetPath" type="input"></el-input>
              <div><el-tag type="info">格式: A##B, # 为分割符</el-tag></div>
            </el-form-item>
            <el-form-item required label="生成链接文件目录" prop="linkFilePath">
              <el-input v-model="rule.linkFilePath" type="input"></el-input>
              <div><el-tag type="info">标准的目录格式, 应为影视库的顶级目录</el-tag></div>
            </el-form-item>
            <el-form-item label="剧集名" prop="keepSeriesName">
              <el-checkbox v-model="rule.keepSeriesName">保留剧集名</el-checkbox>
              <div><el-tag type="info">软链接时在文件名前添加剧集的名称</el-tag></div>
            </el-form-item>
            <el-form-item label="制作组" prop="group">
              <el-checkbox v-model="rule.group">保留制作组</el-checkbox>
              <div><el-tag type="info">软链接时在文件名最后保留制作组, 以文件名最后一个 - 符号为标志, 之后的内容被判定为制作组</el-tag></div>
            </el-form-item>
            <el-form-item label="保留关键词" prop="reservedKeys">
              <el-input v-model="rule.reservedKeys" type="input"></el-input>
              <div><el-tag type="info">软链接时保留关键词, 可以用 , 分割多个关键字, 在软链接时将按照关键词的顺序检索文件名, 若存在则保留</el-tag></div>
            </el-form-item>
            <el-form-item label="排除关键词" prop="excludeKeys">
              <el-input v-model="rule.excludeKeys" type="input"></el-input>
              <div><el-tag type="info">软链接时排除关键词, 可以用 , 分割多个关键字, 各个关键字间为 或 的关系</el-tag></div>
            </el-form-item>
            <el-form-item required label="单文件最小体积" prop="minFileSize">
              <el-input v-model="rule.minFileSize" type="input"></el-input>
              <div><el-tag type="info">单个文件的最小体积, 若文件体积小于本值, 将不对本文件进行软连接操作, 例: 5*1024*1024 表示 5MiB</el-tag></div>
            </el-form-item>
            <el-form-item size="small">
              <el-button type="primary" @click="handleRuleClick">新增 | 编辑</el-button>
              <el-button type="primary" @click="importRuleVisible = !importRuleVisible">导入</el-button>
              <el-button @click="clearRule">清空</el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </div>
    <el-dialog title="导入规则" :visible.sync="importRuleVisible" width="80%">
      <el-form label-width="144px" size="mini" style="width: 80%;">
        <el-form-item label="规则">
          <el-input v-model="importRuleText" type="textarea" :rows="20"  style="width: 500px;"></el-input>
        </el-form-item>
        <el-form-item size="mini">
          <el-button type="primary" @click="importRule">导入</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data () {
    return {
      rule: {},
      defaultRule: {},
      ruleList: [],
      serverList: [],
      ruleCollapse: ['1'],
      importRuleVisible: false,
      importRuleText: ''
    };
  },
  methods: {
    async handleRuleClick () {
      this.$refs.rule.validate(async (valid) => {
        if (valid) {
          const url = '/api/linkRule/' + (this.rule.id ? 'modify' : 'add');
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
    async linkRule (row) {
      const url = '/api/linkRule/delete';
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
      const res = await this.$axiosGet('/api/linkRule/list');
      this.ruleList = res ? res.data : [];
    },
    async listServer () {
      const res = await this.$axiosGet('/api/server/list');
      this.serverList = res ? res.data : [];
    },
    onCopy () {
      this.$message.info('复制到剪贴板成功');
    },
    onError (e) {
      this.$message.error(e.message);
    },
    gotoDocument () {
      window.open('https://lswl.in/2022/03/04/vertex-binge-watching/');
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
    this.$refs.rule.resetFields();
    this.listRule();
    this.listServer();
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
