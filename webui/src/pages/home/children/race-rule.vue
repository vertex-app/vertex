<template>
  <div class="race">
    <div class="radius-div">
      <el-table
        :data="raceList"
        stripe
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
            <el-button @click="modifyRaceRule(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button @click="deleteRaceRule(scope.row)" :disabled="scope.row.used" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="raceCollapse">
        <el-collapse-item title="新增 | 编辑择剧规则" name="1">
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small">规则 ID: {{race.id || '新增'}}</el-tag>
          </div>
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small" type="warning">以下条件必须全部符合, 才算符合本规则</el-tag>
          </div>
          <el-form ref="race" class="race-form" :model="race" label-width="160px" size="mini">
            <el-form-item required label="别名" prop="alias">
              <el-input v-model="race.alias" type="input"></el-input>
            </el-form-item>
            <el-form-item required label="优先级" prop="priority">
              <el-input v-model="race.priority" type="input"></el-input>
              <div><el-tag size="small" type="info">按照优先级从大到小的顺序寻找, 推送首个符合规则的种子</el-tag></div>
            </el-form-item>
            <el-form-item label="排序规则" prop="sortBy">
              <el-select v-model="race.sortBy" style="width: 160px" placeholder="排序指标">
                <el-option v-for="item of conditionKeys" :key="item.key" :label="item.name" :value="item.key"></el-option>
              </el-select>
              <el-select v-model="race.sortType" style="width: 160px" placeholder="升序降序">
                <el-option v-for="item of [{name: '升序', key: 'asc'}, {name: '降序', key: 'desc'}]" :key="item.key" :label="item.name" :value="item.key"></el-option>
              </el-select>
              <div><el-tag size="small" type="info">在使用本规则匹配之前, 按照所选排序规则对种子进行排序, 排序指标默认为种子发布时间, 降序</el-tag></div>
            </el-form-item>
            <el-form-item required label="类型" prop="type">
              <el-select v-model="race.type" style="width: 144px" placeholder="类型">
                  <el-option label="普通" value="normal"></el-option>
                  <el-option label="JavaScript" value="javascript"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item v-if="race.type === 'normal'" label="条件" prop="conditions">
              <el-table
                size="mini"
                stripe
                :data="race.conditions"
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
                    <el-button @click="race.conditions = race.conditions.filter(item => item !== scope.row)" type="danger" size="small">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-button @click="race.conditions.push({ ...condition })" type="primary" size="small">新增</el-button>
            </el-form-item>
            <el-form-item v-if="race.type === 'javascript'" label="自定义代码">
              <el-input v-model="race.code" type="textarea" :rows="20" style="width: 500px;"></el-input>
              <div><el-tag type="info">自定义 Rss 逻辑代码</el-tag></div>
            </el-form-item>
            <el-form-item size="small">
              <el-button type="primary" @click="handleRaceRuleClick">新增 | 编辑</el-button>
              <el-button type="primary" @click="importRaceRuleVisible = !importRaceRuleVisible">导入</el-button>
              <el-button @click="clearRaceRule">清空</el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
      <el-dialog title="导入规则" :visible.sync="importRaceRuleVisible" width="80%">
        <el-form label-width="144px" size="mini" style="width: 80%;">
          <el-form-item label="规则">
            <el-input v-model="importRaceRuleText" type="textarea" :rows="20" style="width: 500px;"></el-input>
          </el-form-item>
          <el-form-item size="mini">
            <el-button type="primary" @click="importRaceRule">导入</el-button>
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
      race: {},
      conditionKeys: [{
        name: '站点',
        key: 'site'
      }, {
        name: '标题',
        key: 'title'
      }, {
        name: '副标题',
        key: 'subtitle'
      }, {
        name: '种子大小',
        key: 'size'
      }, {
        name: '种子分类',
        key: 'category'
      }, {
        name: '做种人数',
        key: 'seeders'
      }, {
        name: '下载人数',
        key: 'leehers'
      }, {
        name: '完成次数',
        key: 'snatches'
      }, {
        name: '发布时间',
        key: 'time'
      }, {
        name: '种子标签',
        key: 'tags'
      }],
      defaultRaceRule: {
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
      raceList: [],
      raceCollapse: ['1'],
      importRaceRuleVisible: false,
      importRaceRuleText: ''
    };
  },
  methods: {
    async handleRaceRuleClick () {
      this.$refs.race.validate(async (valid) => {
        if (valid) {
          const url = '/api/raceRule/' + (this.race.id ? 'modify' : 'add');
          const res = await this.$axiosPost(url, this.race);
          if (!res) {
            return;
          }
          await this.$messageBox(res);
          this.listRaceRule();
          this.clearRaceRule();
        } else {
          return false;
        }
      });
    },
    async deleteRaceRule (row) {
      const url = '/api/raceRule/delete';
      const res = await this.$axiosPost(url, {
        id: row.id
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listRaceRule();
      this.clearRaceRule();
    },
    async modifyRaceRule (row) {
      this.raceCollapse = ['1'];
      this.race = { ...row };
      this.race.conditions = row.conditions.map(item => {
        return { ...item };
      });
    },
    async clearRaceRule () {
      this.race = { ...this.defaultRaceRule };
      this.race.conditions = [{ ...this.condition }];
      this.$refs.race.resetFields();
    },
    async listRaceRule () {
      const res = await this.$axiosGet('/api/raceRule/list');
      this.raceList = res ? res.data : [];
    },
    onCopy () {
      this.$message.info('复制到剪贴板成功');
    },
    onError (e) {
      this.$message.error(e.message);
    },
    importRaceRule () {
      this.clearRaceRule();
      try {
        this.race = {
          ...JSON.parse(this.importRaceRuleText),
          id: undefined
        };
        this.importRaceRuleVisible = false;
        this.importRaceRuleText = '';
      } catch (e) {
        this.$message.error('输入内容有误');
      }
    }
  },
  async mounted () {
    this.race = { ...this.defaultRaceRule };
    this.race.conditions = [{ ...this.condition }];
    this.$refs.race.resetFields();
    this.listRaceRule();
  }
};
</script>

<style scoped>
.race-div {
  margin: 20px 0;
}

.radius-div {
  border-radius: 8px;
  background: #FFFFFF;
}

.collapse {
  margin: 20px;
}

.race-form * {
  width: fit-content;
  text-align: left;
}
</style>
