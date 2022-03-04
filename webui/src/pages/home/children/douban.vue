<template>
  <div class="douban">
    <div class="radius-div">
      <el-table
        :data="doubanList"
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
          width="330">
          <template slot-scope="scope">
            <el-button @click="refreshWishes(scope.row)" type="primary" size="small">刷新想看</el-button>
            <el-button
              type="primary"
              size="small"
              v-clipboard:copy="JSON.stringify(scope.row, null, 2)"
              v-clipboard:success="onCopy"
              v-clipboard:error="onError">
              复制
            </el-button>
            <el-button @click="modifyDouban(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button @click="deleteDouban(scope.row)" :disabled="scope.row.used" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="doubanCollapse">
        <el-collapse-item title="想看列表" name="0">
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag type="info">可以点击标签后的 x 删除系统记录, 刷新后会尝试再一次选种推送</el-tag>
          </div>
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag
              :color="`${$colors[item.doubanId.charCodeAt(0) % 6]}`"
              closable
              v-for="item in wishList"
              :key="item.id + item.doubanId"
              @close="deleteItem(item)"
              style="margin-left: 24px; margin-top: 16px">
              {{`${item.name}: ${item.downloaded ? '已下载' : '未下载'}`}}
            </el-tag>
          </div>
        </el-collapse-item>
        <el-collapse-item title="新增 | 编辑豆瓣账号" name="1">
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small">豆瓣账号 ID: {{douban.id || '新增'}}</el-tag>
          </div>
          <el-form ref="douban" class="douban-form" :model="douban" label-width="160px" size="mini">
            <el-form-item required label="别名" prop="alias">
              <el-input v-model="douban.alias" type="input"></el-input>
            </el-form-item>
            <el-form-item required label="选择站点" prop="sites">
              <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">全选</el-checkbox>
              <el-checkbox-group v-model="douban.sites">
                <el-checkbox v-for="site of siteList" :key="site.name" :disabled="!site.enable" :label="site.name">{{site.name}}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag type="info">选择站点, 仅可选择已经启用的站点</el-tag></div>
            </el-form-item>
            <el-form-item required label="选择规则" prop="raceRules">
              <el-checkbox-group v-model="douban.raceRules">
                <el-checkbox v-for="rule of raceRuleList" :key="rule.id" :label="rule.id">{{rule.alias}}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag type="info">选择选种规则, 选种规则可前往选种规则分页添加</el-tag></div>
            </el-form-item>
            <el-form-item label="选择链接规则" prop="linkRule">
              <el-select v-model="douban.linkRule" placeholder="选择选种规则">
                <el-option v-for="rule of linkRuleList" :key="rule.id" :label="rule.alias" :value="rule.id">{{rule.alias}}</el-option>
              </el-select>
              <div><el-tag type="info">选择链接规则, 链接规则可前往链接规则分页添加</el-tag></div>
            </el-form-item>
            <el-form-item required label="Cookie" prop="cookie">
              <el-input v-model="douban.cookie" type="textarea" :row="3" style="width: 300px"></el-input>
              <div><el-tag size="small" type="info">登录豆瓣账户后获取到的 Cookie</el-tag></div>
            </el-form-item>
            <el-form-item required label="刷新周期" prop="cron">
              <el-input v-model="douban.cron" type="input"></el-input>
              <div><el-tag size="small" type="info">刷新 想看 列表的周期, 默认为 一小时 一次</el-tag></div>
            </el-form-item>
            <el-form-item required label="推送通知" prop="push">
              <el-checkbox v-model="douban.push">推送通知</el-checkbox>
            </el-form-item>
            <el-form-item v-if="douban.push" required label="通知方式" prop="notify">
              <el-select v-model="douban.notify" placeholder="请选择 通知方式">
                <el-option v-for="push of pushList" :key="push.id" :label="push.alias" :value="push.id"></el-option>
              </el-select>
              <div><el-tag type="info">通知方式, 用于推送信息, 在推送工具页面创建</el-tag></div>
            </el-form-item>
            <el-form-item required label="下载器" prop="client">
              <el-select v-model="douban.client" placeholder="请选择下载器">
                <el-option v-for="client of clientList" :key="client.id" :disabled="!client.enable" :label="client.alias" :value="client.id">{{client.alias}}</el-option>
              </el-select>
              <div><el-tag type="info">选择下载器, 仅可选择已经启用的下载器</el-tag></div>
            </el-form-item>
            <el-form-item label="分类">
              <el-input v-model="douban.category" style="width: 200px;"></el-input>
            </el-form-item>
            <el-form-item label="保存路径">
              <el-input v-model="douban.savePath" style="width: 200px;"></el-input>
            </el-form-item>
            <el-form-item label="自动管理">
              <el-checkbox v-model="douban.autoTMM">自动管理</el-checkbox>
            </el-form-item>
            <el-form-item size="small">
              <el-button type="primary" @click="handleDoubanClick">新增 | 编辑</el-button>
              <el-button type="primary" @click="importDoubanVisible = !importDoubanVisible">导入</el-button>
              <el-button @click="clearDouban">清空</el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
      <el-dialog title="导入豆瓣" :visible.sync="importDoubanVisible" width="80%">
        <el-form label-width="144px" size="mini" style="width: 80%;">
          <el-form-item label="豆瓣">
            <el-input v-model="importDoubanText" type="textarea" :rows="20" style="width: 500px;"></el-input>
          </el-form-item>
          <el-form-item size="mini">
            <el-button type="primary" @click="importDouban">导入</el-button>
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
      douban: {},
      defaultDouban: {
        cron: '35 * * * *',
        sites: [],
        raceRules: []
      },
      doubanList: [],
      raceRuleList: [],
      linkRuleList: [],
      siteList: [],
      clientList: [],
      wishList: [],
      isIndeterminate: false,
      checkAll: false,
      doubanCollapse: ['0', '1'],
      importDoubanVisible: false,
      importDoubanText: ''
    };
  },
  methods: {
    async handleDoubanClick () {
      this.$refs.douban.validate(async (valid) => {
        if (valid) {
          const url = '/api/douban/' + (this.douban.id ? 'modify' : 'add');
          const res = await this.$axiosPost(url, this.douban);
          if (!res) {
            return;
          }
          await this.$messageBox(res);
          this.listDouban();
          this.clearDouban();
        } else {
          return false;
        }
      });
    },
    async deleteDouban (row) {
      const url = '/api/douban/delete';
      const res = await this.$axiosPost(url, {
        id: row.id
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listDouban();
      this.clearDouban();
    },
    async modifyDouban (row) {
      this.doubanCollapse = ['0', '1'];
      this.douban = { ...row };
      this.douban.conditions = row.conditions.map(item => {
        return { ...item };
      });
    },
    async refreshWishes (row) {
      const url = '/api/douban/refreshWishes';
      const res = await this.$axiosPost(url, {
        id: row.id
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
    },
    async deleteItem (row) {
      const url = '/api/douban/deleteItem';
      const res = await this.$axiosPost(url, {
        doubanId: row.id,
        id: row.doubanId
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listWishes();
    },
    async clearDouban () {
      this.douban = { ...this.defaultDouban };
      this.douban.conditions = [{ ...this.condition }];
      this.$refs.douban.resetFields();
    },
    async listDouban () {
      const res = await this.$axiosGet('/api/douban/list');
      this.doubanList = res ? res.data : [];
    },
    async listWishes () {
      const res = await this.$axiosGet('/api/douban/listWishes');
      this.wishList = res ? res.data.sort((a, b) => a.name > b.name ? 1 : -1) : [];
    },
    async listLinkRule () {
      const res = await this.$axiosGet('/api/linkRule/list');
      this.linkRuleList = res ? res.data : [];
    },
    handleCheckAllChange (value) {
      this.douban.sites = value ? this.siteList.map(i => i.name) : [];
      this.isIndeterminate = false;
    },
    async listPush () {
      const res = await this.$axiosGet('/api/push/list');
      this.pushList = res ? res.data : [];
    },
    async listRaceRule () {
      const res = await this.$axiosGet('/api/raceRule/list');
      this.raceRuleList = res ? res.data : [];
    },
    async listClient () {
      const res = await this.$axiosGet('/api/client/list');
      this.clientList = res ? res.data : [];
    },
    async listSite () {
      const res = await this.$axiosGet('/api/site/list');
      this.siteList = res ? res.data.siteList : [];
    },
    onCopy () {
      this.$message.info('复制到剪贴板成功');
    },
    onError (e) {
      this.$message.error(e.message);
    },
    importDouban () {
      this.clearDouban();
      try {
        this.douban = {
          ...JSON.parse(this.importDoubanText),
          id: undefined
        };
        this.importDoubanVisible = false;
        this.importDoubanText = '';
      } catch (e) {
        this.$message.error('输入内容有误');
      }
    }
  },
  async mounted () {
    this.douban = { ...this.defaultDouban };
    this.douban.conditions = [{ ...this.condition }];
    this.$refs.douban.resetFields();
    this.listDouban();
    this.listSite();
    this.listClient();
    this.listPush();
    this.listRaceRule();
    this.listLinkRule();
    this.listWishes();
  }
};
</script>

<style scoped>
.douban-div {
  margin: 20px 0;
}

.radius-div {
  border-radius: 8px;
  background: #FFFFFF;
}

.collapse {
  margin: 20px;
}

.douban-form * {
  width: fit-content;
  text-align: left;
}
</style>
