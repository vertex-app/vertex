<template>
  <div class="rule">
    <div class="radius-div">
      <el-table
        :data="ruleList"
        :default-sort="{prop: 'alias'}"
        stripe
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
          sortable
          prop="fitTime"
          label="持续时间">
        </el-table-column>
        <el-table-column
          sortable
          :sort-method="(a, b) => +a.priority - +b.priority"
          prop="priority"
          label="优先级">
        </el-table-column>
        <el-table-column
          sortable
          prop="type"
          label="类型">
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
    </div>
    <div class="radius-div">
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
            <el-form-item label="持续时间" prop="fitTime">
              <el-input v-model="rule.fitTime" type="input"></el-input>
              <div><el-tag type="info">符合删种规则的持续时间, 只有到达持续时间之后才会删种, 单位为 秒, 不启用留空, 建议考虑客户端的删种周期一起设置</el-tag></div>
            </el-form-item>
            <el-form-item label="优先级" prop="priority">
              <el-input v-model="rule.priority" type="input"></el-input>
              <div><el-tag type="info">优先级越高的规则越执行, 默认为 0</el-tag></div>
            </el-form-item>
            <el-form-item required label="类型" prop="type">
              <el-select v-model="rule.type" style="width: 144px" placeholder="类型">
                  <el-option label="普通" value="normal"></el-option>
                  <el-option label="JavaScript" value="javascript"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item v-if="rule.type === 'normal'" label="限制条件">
              <el-table
                size="mini"
                stripe
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
                  label="类型"
                  width="144">
                  <template slot-scope="scope">
                    <el-select v-model="scope.row.compareType" style="width: 120px" placeholder="比较类型">
                      <el-option label="等于" value="equals"></el-option>
                      <el-option label="大于" value="bigger"></el-option>
                      <el-option label="小于" value="smaller"></el-option>
                      <el-option label="包含" value="contain"></el-option>
                      <el-option label="包含于" value="includeIn"></el-option>
                      <el-option label="不包含" value="notContain"></el-option>
                      <el-option label="不包含于" value="notIncludeIn"></el-option>
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
              <el-button @click="rule.conditions.push({ key: '', compareType: '', value: ''})" type="primary" size="small">新增</el-button>
              <el-card style="margin: 12px 0; max-width: 640px" >
                比较类型中的包含于或不包含于: 值部分需以半角逗号 , 为分割符, 如种子分类不包含于 KEEP, KEEP2, KEEP3 三个分类, 则应填写:
                <el-tag>KEEP,KEEP2,KEEP3</el-tag><br>
                个别选项解释: <br>
                1. 分享率一: 上传 / 种子大小 的结果<br>
                2. 分享率二: 上传 / 下载 的结果<br>
                3. 站点域名: 种子的 Tracker 地址的域名部分<br>
                4. 各类时间: 选项时间到当前时间的差值, 单位为 秒/s<br>
                5. 各类大小: 单位为 字节 / Byte<br>
                6. 各类速度: 单位为 字节/s / Byte/s<br>
                6. 种子状态: 参照 qBittorrent 对种子状态的定义, 主要包含以下几类: <br>
                上传中: <el-tag>uploading</el-tag>, 下载中: <el-tag>downloading</el-tag><br>
                等待下载: <el-tag>stalledDL</el-tag>, 做种但无上传: <el-tag>stalledUP</el-tag><br>
                更多状态请参照 qBittorrent Wiki, 若想删除等待下载状态下的种子, 应填写 stalledDL<br>
                7. 做种下载连接: 仅计算已连接上的数量, 也即 qBittorrent WebUI 内括号外的数字 <br>
              </el-card>
            </el-form-item>
            <el-form-item v-if="rule.type === 'javascript'" label="自定义代码">
              <el-input v-model="rule.code" type="textarea" :rows="20" style="width: 500px;"></el-input>
              <div><el-tag type="info">自定义删种逻辑代码</el-tag></div>
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
        name: '种子进度',
        key: 'progress'
      }, {
        name: '上传速度',
        key: 'uploadSpeed'
      }, {
        name: '下载速度',
        key: 'downloadSpeed'
      }, {
        name: '种子分类',
        key: 'category'
      }, {
        name: '种子大小',
        key: 'size'
      }, {
        name: '站点域名',
        key: 'tracker'
      }, {
        name: '已完成量',
        key: 'completed'
      }, {
        name: '已下载量',
        key: 'downloaded'
      }, {
        name: '已上传量',
        key: 'uploaded'
      }, {
        name: '分享率一',
        key: 'ratio'
      }, {
        name: '分享率二',
        key: 'trueRatio'
      }, {
        name: '种子状态',
        key: 'state'
      }, {
        name: '添加时间',
        key: 'addedTime'
      }, {
        name: '完成时间',
        key: 'completedTime'
      }, {
        name: '保存路径',
        key: 'savePath'
      }, {
        name: '做种连接',
        key: 'seeder'
      }, {
        name: '下载连接',
        key: 'leecher'
      }],
      defaultRule: {
        conditions: [{
          key: '',
          compareType: '',
          value: ''
        }],
        priority: 0,
        code: '(maindata, torrent) => {\n' +
              '  return false;\n' +
              '}'
      },
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

.radius-div {
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
