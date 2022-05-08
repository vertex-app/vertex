<template>
  <div class="race">
    <div class="radius-div">
      <el-table
        :data="raceRuleSetList"
        :default-sort="{prop: 'priority', order: 'descending'}"
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
            <el-button @click="modifyRaceRuleSet(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button @click="deleteRaceRuleSet(scope.row)" :disabled="scope.row.used" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="raceCollapse">
        <el-collapse-item title="新增 | 编辑选种规则集" name="1">
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small">规则集 ID: {{raceRuleSet.id || '新增'}}</el-tag>
          </div>
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small" type="warning">以下条件必须全部符合, 才算符合本规则</el-tag>
          </div>
          <el-form ref="raceRuleSet" class="race-form" :model="raceRuleSet" label-width="160px" size="mini">
            <el-form-item required label="别名" prop="alias">
              <el-input v-model="raceRuleSet.alias" type="input"></el-input>
            </el-form-item>
            <el-form-item required label="选择规则" prop="raceRules">
              <el-checkbox :indeterminate="raceRuleIndeterminate" v-model="raceRuleCheckAll" @change="handleraceRuleCheckAllChange">全选</el-checkbox>
              <el-checkbox-group v-model="raceRuleSet.raceRules">
                <el-checkbox v-for="raceRule of raceRuleList" :key="raceRule.id" :label="raceRule.id">{{ raceRule.alias }}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag type="info">选择站点, 仅可选择已经启用的站点</el-tag></div>
            </el-form-item>
            <el-form-item size="small">
              <el-button type="primary" @click="handleRaceRuleSetClick">新增 | 编辑</el-button>
              <el-button type="primary" @click="importRaceRuleSetVisible = !importRaceRuleSetVisible">导入</el-button>
              <el-button @click="clearRaceRuleSet">清空</el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </div>
    <el-dialog title="导入规则" :visible.sync="importRaceRuleSetVisible" width="80%">
      <el-form label-width="144px" size="mini" style="width: 80%;">
        <el-form-item label="规则">
          <el-input v-model="importRaceRuleSetText" type="textarea" :rows="20" style="width: 500px;"></el-input>
        </el-form-item>
        <el-form-item size="mini">
          <el-button type="primary" @click="importRaceRuleSet">导入</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data () {
    return {
      raceRuleSet: {},
      defaultRaceRuleSet: {
        raceRules: []
      },
      raceRuleSetList: [],
      raceRuleList: [],
      raceCollapse: ['1'],
      raceRuleIndeterminate: true,
      raceRuleCheckAll: false,
      importRaceRuleSetVisible: false,
      importRaceRuleSetText: ''
    };
  },
  methods: {
    async handleRaceRuleSetClick () {
      this.$refs.raceRuleSet.validate(async (valid) => {
        if (valid) {
          const url = '/api/raceRuleSet/' + (this.raceRuleSet.id ? 'modify' : 'add');
          const res = await this.$axiosPost(url, this.raceRuleSet);
          if (!res) {
            return;
          }
          await this.$messageBox(res);
          this.listRaceRuleSet();
          this.clearRaceRuleSet();
        } else {
          return false;
        }
      });
    },
    async deleteRaceRuleSet (row) {
      const url = '/api/raceRuleSet/delete';
      const res = await this.$axiosPost(url, {
        id: row.id
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listRaceRuleSet();
      this.clearRaceRuleSet();
    },
    async modifyRaceRuleSet (row) {
      this.raceCollapse = ['1'];
      this.raceRuleSet = { ...row };
    },
    async clearRaceRuleSet () {
      this.raceRuleSet = { ...this.defaultRaceRuleSet };
      this.$refs.raceRuleSet.resetFields();
    },
    async listRaceRuleSet () {
      const res = await this.$axiosGet('/api/raceRuleSet/list');
      this.raceRuleSetList = res ? res.data : [];
    },
    async listRaceRule () {
      const res = await this.$axiosGet('/api/raceRule/list');
      this.raceRuleList = res ? res.data : [];
    },
    handleraceRuleCheckAllChange (value) {
      this.raceRuleSet.raceRules = value ? this.raceRuleList.map(i => i.id) : [];
      this.raceRuleIndeterminate = false;
    },
    onCopy () {
      this.$message.info('复制到剪贴板成功');
    },
    onError (e) {
      this.$message.error(e.message);
    },
    importRaceRuleSet () {
      this.clearRaceRuleSet();
      try {
        this.raceRuleSet = {
          ...JSON.parse(this.importRaceRuleSetText),
          id: undefined
        };
        this.importRaceRuleSetVisible = false;
        this.importRaceRuleSetText = '';
      } catch (e) {
        this.$message.error('输入内容有误');
      }
    }
  },
  async mounted () {
    this.raceRuleSet = { ...this.defaultRaceRuleSet };
    this.$refs.raceRuleSet.resetFields();
    this.listRaceRuleSet();
    this.listRaceRule();
  }
};
</script>

<style scoped>
.race-div {
  margin: 20px 0;
}

.collapse {
  margin: 20px;
}

.race-form * {
  width: fit-content;
  text-align: left;
}
</style>
