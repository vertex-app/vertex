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
          sortable
          prop="category"
          label="分类">
        </el-table-column>
        <el-table-column
          sortable
          prop="savePath"
          label="保存路径">
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
            <el-button @click="modifyRace(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button @click="deleteRace(scope.row)" :disabled="scope.row.used" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="raceCollapse">
        <el-collapse-item title="新增 | 编辑自动追剧" name="1">
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small">自动追剧 ID: {{race.id || '新增'}}</el-tag>
          </div>
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small" type="warning">以下条件必须全部符合, 才触发添加种子操作</el-tag>
          </div>
          <el-form ref="race" class="race-form" :model="race" label-width="160px" size="mini">
            <el-form-item required label="别名" prop="alias">
              <el-input v-model="race.alias" type="input"></el-input>
            </el-form-item>
            <el-form-item required label="启用" prop="enable">
              <el-checkbox v-model="race.enable">启用</el-checkbox>
            </el-form-item>
            <el-form-item required label="关键词" prop="keyword">
              <el-input v-model="race.keyword" type="input" style="width: 200px;"></el-input>
              <div><el-tag type="info">在站点搜索种子所用到的关键词</el-tag></div>
            </el-form-item>
            <el-form-item required label="下载器" prop="client">
              <el-select v-model="race.client" placeholder="请选择下载器">
                <el-option v-for="client of clientList" :key="client.id" :disabled="!client.enable" :label="client.alias" :value="client.id">{{client.alias}}</el-option>
              </el-select>
              <div><el-tag type="info">选择下载器, 仅可选择已经启用的下载器</el-tag></div>
            </el-form-item>
            <el-form-item required label="选择站点" prop="sites">
              <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">全选</el-checkbox>
              <el-checkbox-group v-model="race.sites">
                <el-checkbox v-for="site of siteList" :key="site.name" :disabled="!site.enable" :label="site.name">{{site.name}}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag type="info">选择站点, 仅可选择已经启用的站点</el-tag></div>
            </el-form-item>
            <el-form-item required label="选择选种规则" prop="raceRules">
              <el-checkbox-group v-model="race.raceRules">
                <el-checkbox v-for="rule of raceRuleList" :key="rule.id" :label="rule.id">{{rule.alias}}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag type="info">选择选种规则, 选种规则可前往选种规则分页添加</el-tag></div>
            </el-form-item>
            <el-form-item required label="选择链接规则" prop="linkRule">
              <el-select v-model="race.linkRule" placeholder="选择选种规则">
                <el-option v-for="rule of linkRuleList" :key="rule.id" :label="rule.alias" :value="rule.id">{{rule.alias}}</el-option>
              </el-select>
              <div><el-tag type="info">选择链接规则, 链接规则可前往链接规则分页添加</el-tag></div>
            </el-form-item>
            <el-form-item required label="推送通知" prop="push">
              <el-checkbox v-model="race.push">推送通知</el-checkbox>
            </el-form-item>
            <el-form-item v-if="race.push" required label="通知方式" prop="notify">
              <el-select v-model="race.notify" placeholder="请选择 通知方式">
                <el-option v-for="push of pushList" :key="push.id" :label="push.alias" :value="push.id"></el-option>
              </el-select>
              <div><el-tag type="info">通知方式, 用于推送信息, 在推送工具页面创建</el-tag></div>
            </el-form-item>
            <el-form-item required label="触发时间">
              <el-input v-model="race.cron" style="width: 200px;"></el-input>
              <div><el-tag type="info">触发时间 Crontab 表达式, 20 20 * * * 表示每日 20 点 20 分触发一次</el-tag></div>
            </el-form-item>
            <el-form-item label="分类">
              <el-input v-model="race.category" style="width: 200px;"></el-input>
            </el-form-item>
            <el-form-item label="保存路径">
              <el-input v-model="race.savePath" style="width: 200px;"></el-input>
            </el-form-item>
            <el-form-item label="自动管理">
              <el-checkbox v-model="race.autoTMM">自动管理</el-checkbox>
            </el-form-item>
            <el-form-item size="small">
              <el-button type="primary" @click="handleRaceClick">新增 | 编辑</el-button>
              <el-button type="primary" @click="importRaceVisible = !importRaceVisible">导入</el-button>
              <el-button @click="clearRace">清空</el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
      <el-dialog title="导入自动追剧" :visible.sync="importRaceVisible" width="80%">
        <el-form label-width="144px" size="mini" style="width: 80%;">
          <el-form-item label="自动追剧">
            <el-input v-model="importRaceText" type="textarea" :rows="20" style="width: 500px;"></el-input>
          </el-form-item>
          <el-form-item size="mini">
            <el-button type="primary" @click="importRace">导入</el-button>
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
      defaultRace: {
        enable: false,
        sites: [],
        raceRules: [],
        client: '',
        autoTMM: false,
        cron: '20 20 * * *'
      },
      linkRuleList: [],
      raceList: [],
      raceRuleList: [],
      isIndeterminate: false,
      checkAll: false,
      siteList: [],
      clientList: [],
      raceCollapse: ['1'],
      importRaceVisible: false,
      importRaceText: ''
    };
  },
  methods: {
    async handleRaceClick () {
      this.$refs.race.validate(async (valid) => {
        if (valid) {
          const url = '/api/race/' + (this.race.id ? 'modify' : 'add');
          const res = await this.$axiosPost(url, this.race);
          if (!res) {
            return;
          }
          await this.$messageBox(res);
          this.listRace();
          this.clearRace();
        } else {
          return false;
        }
      });
    },
    async deleteRace (row) {
      const url = '/api/race/delete';
      const res = await this.$axiosPost(url, {
        id: row.id
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listRace();
      this.clearRace();
    },
    handleCheckAllChange (value) {
      this.race.sites = value ? this.siteList.map(i => i.name) : [];
      this.isIndeterminate = false;
    },
    async modifyRace (row) {
      this.raceCollapse = ['1'];
      this.race = { ...row };
      this.race.conditions = row.conditions.map(item => {
        return { ...item };
      });
    },
    async clearRace () {
      this.race = { ...this.defaultRace };
      this.race.conditions = [{ ...this.condition }];
      this.$refs.race.resetFields();
    },
    async listRace () {
      const res = await this.$axiosGet('/api/race/list');
      this.raceList = res ? res.data : [];
    },
    async listRaceRule () {
      const res = await this.$axiosGet('/api/raceRule/list');
      this.raceRuleList = res ? res.data : [];
    },
    async listLinkRule () {
      const res = await this.$axiosGet('/api/linkRule/list');
      this.linkRuleList = res ? res.data : [];
    },
    async listClient () {
      const res = await this.$axiosGet('/api/client/list');
      this.clientList = res ? res.data : [];
    },
    async listSite () {
      const res = await this.$axiosGet('/api/site/list');
      this.siteList = res ? res.data.siteList : [];
    },
    async listPush () {
      const res = await this.$axiosGet('/api/push/list');
      this.pushList = res ? res.data : [];
    },
    onCopy () {
      this.$message.info('复制到剪贴板成功');
    },
    onError (e) {
      this.$message.error(e.message);
    },
    importRace () {
      this.clearRace();
      try {
        this.race = {
          ...JSON.parse(this.importRaceText),
          id: undefined
        };
        this.importRaceVisible = false;
        this.importRaceText = '';
      } catch (e) {
        this.$message.error('输入内容有误');
      }
    }
  },
  async mounted () {
    this.race = { ...this.defaultRace };
    this.race.conditions = [{ ...this.condition }];
    this.$refs.race.resetFields();
    this.listRace();
    this.listSite();
    this.listClient();
    this.listPush();
    this.listRaceRule();
    this.listLinkRule();
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
