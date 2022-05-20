<template>
  <div class="rss">
    <div class="radius-div">
      <el-table
        :data="rssList"
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
          prop="enable"
          label="启用"
          width="100">
          <template slot-scope="scope">
            <el-switch
              @change="switchClick(scope.row)"
              v-model="scope.row.enable">
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column
          label="下载器"
          width="150"
          :filters="clientList.filter(item => rssList.some(rssItem => rssItem.clientArr.indexOf(item.id) !== -1)).map(item => {
            return {
              text: item.alias,
              value: item.id
            }
          })"
          :filter-method="(value, row, column) => {
            return row.clientArr.indexOf(value) !== -1;
          }">
          <template slot-scope="scope">
            <el-tag v-for="i of clientList.filter(item => scope.row.clientArr.indexOf(item.id) !== -1)" :key="i.id">{{i.alias.substring(0, 15)}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="推送消息"
          width="100">
          <template slot-scope="scope">
            <el-tag>{{scope.row.pushNotify}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          min-width="300">
          <template slot="header" slot-scope="scope">
            <el-switch
              v-model="urlDisplay">
            </el-switch>
            Rss - Url
          </template>
          <template slot-scope="scope">
            <div v-for="rssUrl of scope.row.rssUrls" :key="rssUrl">
              {{ urlDisplay ? rssUrl.replace(/passkey=[a-z0-9A-z]*/, 'passkey=****') : '**********' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="200">
          <template slot-scope="scope">
            <el-button @click="modifyRss(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button @click="deleteRss(scope.row)" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="rssCollapse">
        <el-collapse-item title="新增 | 编辑 Rss" name="1">
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag>Rss ID: {{rss.id || '新增'}}</el-tag>
          </div>
          <el-form ref="rss" class="rss-form" :model="rss" label-width="160px" size="mini">
            <el-form-item required label="别名" prop="alias">
              <el-input v-model="rss.alias"></el-input>
            </el-form-item>
            <el-form-item required label="启用" prop="enable">
              <el-checkbox v-model="rss.enable">启用</el-checkbox>
            </el-form-item>
            <el-form-item required label="下载器" prop="clientArr">
              <el-checkbox-group v-model="rss.clientArr">
                <el-checkbox v-for="client of clientList" :key="client.id" :disabled="!client.enable || client.type === 'Transmission'" :label="client.id">{{client.alias}}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag type="info">选择下载器, 仅可选择已经启用的下载器</el-tag></div>
            </el-form-item>
            <el-form-item required label="排序规则" prop="clientSortBy">
              <el-select v-model="rss.clientSortBy" style="width: 144px" placeholder="排序规则">
                <el-option label="下载种子数量" value="leechingCount"></el-option>
                <el-option label="当前上传速度" value="uploadSpeed"></el-option>
                <el-option label="当前下载速度" value="downloadSpeed"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="下载器最高上传速度" prop="maxClientUploadSpeed">
              <el-input v-model="rss.maxClientUploadSpeed">
                <el-select v-model="rss.maxClientUploadSpeedUnit" slot="append" style="width: 80px" placeholder="单位">
                  <el-option label="KiB/s" value="KiB"></el-option>
                  <el-option label="MiB/s" value="MiB"></el-option>
                  <el-option label="GiB/s" value="GiB"></el-option>
                </el-select>
              </el-input>
              <div><el-tag type="info">下载器上传速度在此速度之上时, 不添加种子, 留空或 0 不启用</el-tag></div>
            </el-form-item>
            <el-form-item label="下载器最高下载速度" prop="maxClientDownloadSpeed">
              <el-input v-model="rss.maxClientDownloadSpeed">
                <el-select v-model="rss.maxClientDownloadSpeedUnit" slot="append" style="width: 80px" placeholder="单位">
                  <el-option label="KiB/s" value="KiB"></el-option>
                  <el-option label="MiB/s" value="MiB"></el-option>
                  <el-option label="GiB/s" value="GiB"></el-option>
                </el-select>
              </el-input>
              <div><el-tag type="info">下载器下载速度在此速度之上时, 不添加种子, 留空或 0 不启用</el-tag></div>
            </el-form-item>
            <el-form-item label="下载器下载任务上限" prop="maxClientDownloadCount">
              <el-input v-model="rss.maxClientDownloadCount"></el-input>
              <div><el-tag type="info">下载器下载任务之上时, 不添加种子, 留空或 0 不启用</el-tag></div>
            </el-form-item>
            <el-form-item required label="RssUrl 列表" prop="rssUrls">
              <div v-for="(item, index) in rss.rssUrls" :key="index" style="margin-top: 6px">
                <el-input v-model="rss.rssUrls[index]" style="width: 350px;"></el-input>
                <el-button
                  @click="() => rss.rssUrls = rss.rssUrls.filter(i => i !== rss.rssUrls[index])"
                  type="danger" size="small"
                  style="margin-left: 6px">删除</el-button>
              </div>
              <el-button @click="rss.rssUrls.push('')" type="primary" size="small">新增</el-button>
            </el-form-item>
            <el-form-item v-if="rss.scrapeHr || rss.scrapeFree" :required="rss.scrapeHr || rss.scrapeFree" label="Cookie" prop="cookie">
              <el-input v-model="rss.cookie" style="width: 500px;"></el-input>
            </el-form-item>
            <el-form-item required label="推送通知" prop="pushNotify">
              <el-checkbox v-model="rss.pushNotify">推送通知</el-checkbox>
            </el-form-item>
            <el-form-item v-if="rss.pushNotify" required label="通知方式" prop="notify">
              <el-select v-model="rss.notify" placeholder="请选择 通知方式">
                <el-option v-for="push of pushList" :key="push.id" :label="push.alias" :value="push.id"></el-option>
              </el-select>
              <div><el-tag type="info">通知方式, 用于推送 Rss 相关信息, 在推送工具页面创建</el-tag></div>
            </el-form-item>
            <el-form-item required label="Rss 周期" prop="cron">
              <el-input v-model="rss.cron" style="width: 500px;"></el-input>
              <div><el-tag type="info">Rss Cron 表达式, 默认为 1 分钟更新一次</el-tag></div>
            </el-form-item>
            <el-form-item required label="限制上传速度" prop="uploadLimit">
              <el-input v-model="rss.uploadLimit">
                <el-select v-model="rss.uploadLimitUnit" slot="append" style="width: 80px" placeholder="单位">
                  <el-option label="KiB/s" value="KiB"></el-option>
                  <el-option label="MiB/s" value="MiB"></el-option>
                  <el-option label="GiB/s" value="GiB"></el-option>
                </el-select>
              </el-input>
              <div><el-tag type="info">限制种子的上传速度, 0 为不限速</el-tag></div>
            </el-form-item>
            <el-form-item required label="限制下载速度" prop="downloadLimit">
              <el-input v-model="rss.downloadLimit">
                <el-select v-model="rss.downloadLimitUnit" slot="append" style="width: 80px" placeholder="单位">
                  <el-option label="KiB/s" value="KiB"></el-option>
                  <el-option label="MiB/s" value="MiB"></el-option>
                  <el-option label="GiB/s" value="GiB"></el-option>
                </el-select>
              </el-input>
              <div><el-tag type="info">限制种子的下载速度, 0 为不限速</el-tag></div>
            </el-form-item>
            <el-form-item required label="抓取免费" prop="scrapeFree">
              <el-checkbox v-model="rss.scrapeFree"></el-checkbox>
              <div><el-tag type="info">仅添加免费种子, 仅会在 rss 时判断 1 次, 因此魔力促销类可能不会添加, 不支持的站点不要勾!</el-tag></div>
            </el-form-item>
            <el-form-item required label="排除 HR" prop="scrapeHr">
              <el-checkbox v-model="rss.scrapeHr"></el-checkbox>
              <div><el-tag type="info">仅添加非 HR 种子, 仅会在 rss 时判断 1 次, 不支持的站点不要勾!</el-tag></div>
            </el-form-item>
            <el-form-item label="每小时上限" prop="addCountPerHour">
              <el-input v-model="rss.addCountPerHour" style="width: 500px;"></el-input>
              <div><el-tag type="info">每小时向客户端推送种子数量上限, 留空为 20, 编辑 Rss 或重启后重置计数</el-tag></div>
            </el-form-item>
            <el-form-item label="等待时间" prop="sleepTime">
              <el-input v-model="rss.sleepTime" style="width: 500px;"></el-input>
              <div><el-tag type="info">若在 Rss 时种子是非免费状态, 将在种子发布后的一段时间内重复抓取免费状态, 建议等待时间略小于 Rss 周期</el-tag></div>
            </el-form-item>
            <el-form-item v-if="!hideReseed" required label="自动辅种 Beta" prop="autoReseed">
              <el-checkbox v-model="rss.autoReseed"></el-checkbox>
              <div><el-tag type="info">自动辅种已经下载完成的种子, 自动跳检, 属实验性功能, 慎用</el-tag></div>
            </el-form-item>
            <el-form-item v-if="!hideReseed" required label="仅自动辅种" prop="onlyReseed">
              <el-checkbox v-model="rss.onlyReseed"></el-checkbox>
              <div><el-tag type="info">若种子没有匹配自动辅种, 则跳过种子, 不会添加到下载器</el-tag></div>
            </el-form-item>
            <el-form-item v-if="!hideReseed" required label="仅辅种以下下载器" prop="reseedClients">
              <el-checkbox-group v-model="rss.reseedClients">
                <el-checkbox v-for="c of clientList" :disabled="!c.enable" :key="c.id" :label="c.id">{{c.alias}}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag type="info">辅种时仅辅种以上下载器</el-tag></div>
            </el-form-item>
            <el-form-item label="保存路径" prop="savePath">
              <el-input v-model="rss.savePath"></el-input>
              <div><el-tag type="info">保存路径</el-tag></div>
            </el-form-item>
            <el-form-item label="分类" prop="category">
              <el-input v-model="rss.category"></el-input>
              <div><el-tag type="info">分类</el-tag></div>
            </el-form-item>
            <el-form-item required label="最长休眠时间" prop="maxSleepTime">
              <el-input v-model="rss.maxSleepTime"></el-input>
              <div><el-tag type="info">最长休眠时间, 若上次成功 RSS 在 N 秒以前, 则本次 RSS 拒绝所有种子, 建议为 3-5 倍于 Rss 周期, 单位为秒</el-tag></div>
            </el-form-item>
            <el-form-item label="跳过大小相同种子" prop="skipSameTorrent">
              <el-checkbox v-model="rss.skipSameTorrent">跳过大小相同种子</el-checkbox>
              <div><el-tag type="info">跳过所有下载器内存在大小相同种子的种子</el-tag></div>
            </el-form-item>
            <el-form-item label="拒绝规则">
              <el-checkbox-group v-model="rss.rejectRules">
                <el-checkbox v-for="rule of rssRuleList" :key="rule.id" :label="rule.id">{{rule.alias}}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag  v-if="rssRuleList.length === 0" type="danger">目前没有 Rss 规则, 如需添加, 请前往 Rss 规则 页面</el-tag></div>
              <div><el-tag type="info">拒绝规则, 种子状态符合其中一个时即触发拒绝种子操作</el-tag></div>
            </el-form-item>
            <el-form-item label="选择规则">
              <el-checkbox-group v-model="rss.acceptRules">
                <el-checkbox v-for="rule of rssRuleList" :key="rule.id" :label="rule.id">{{rule.alias}}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag  v-if="rssRuleList.length === 0" type="danger">目前没有 Rss 规则, 如需添加, 请前往 Rss 规则 页面</el-tag></div>
              <div><el-tag type="info">选择规则, 种子状态符合其中一个时即触发添加种子操作</el-tag></div>
            </el-form-item>
            <el-form-item size="small">
              <el-button type="primary" @click="handleRssClick">新增 | 编辑</el-button>
              <el-button @click="clearRss">清空</el-button>
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
      hideReseed: true,
      rss: {},
      defaultRss: {
        clientArr: [],
        enable: false,
        scrapeFree: false,
        scrapeHr: false,
        autoReseed: false,
        onlyReseed: false,
        maxSleepTime: 600,
        skipSameTorrent: true,
        cron: '* * * * *',
        addCountPerHour: '',
        pushNotify: false,
        acceptRules: [],
        rejectRules: [],
        reseedClients: [],
        rssUrls: ['']
      },
      pushList: [],
      urlDisplay: true,
      rssList: [],
      rssRuleList: [],
      clientList: [],
      rssCollapse: ['1']
    };
  },
  methods: {
    async handleRssClick () {
      this.$refs.rss.validate(async (valid) => {
        if (valid) {
          const url = '/api/rss/' + (this.rss.id ? 'modify' : 'add');
          const res = await this.$axiosPost(url, this.rss);
          if (!res) {
            return;
          }
          await this.$messageBox(res);
          this.listRss();
          this.clearRss();
        } else {
          return false;
        }
      });
    },
    async deleteRss (row) {
      const url = '/api/rss/delete';
      const res = await this.$axiosPost(url, {
        id: row.id
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listRss();
      this.clearRss();
    },
    async modifyRss (row) {
      this.rssCollapse = ['1'];
      this.rss = { ...row };
    },
    async switchClick (row) {
      const url = '/api/rss/modify';
      const _row = { ...row };
      const res = await this.$axiosPost(url, _row);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listRss();
      this.clearRss();
    },
    async clearRss () {
      this.rss = { ...this.defaultRss };
      this.$refs.rss.resetFields();
    },
    async listRss () {
      const res = await this.$axiosGet('/api/rss/list');
      this.rssList = res ? res.data : [];
    },
    async listPush () {
      const res = await this.$axiosGet('/api/push/list');
      this.pushList = res ? res.data : [];
    },
    async listClient () {
      const res = await this.$axiosGet('/api/client/list');
      this.clientList = res ? res.data.sort((a, b) => a.alias > b.alias ? 1 : -1) : [];
    },
    async listRssRule () {
      const res = await this.$axiosGet('/api/rssRule/list');
      this.rssRuleList = res ? res.data.sort((a, b) => a.alias > b.alias ? 1 : -1) : [];
    }
  },
  async mounted () {
    window.vue = this;
    this.rss = { ...this.defaultRss };
    await this.listClient();
    this.listRss();
    this.listPush();
    this.listRssRule();
  }
};
</script>

<style scoped>
.rss-div {
  margin: 20px 0;
}

.collapse {
  margin: 20px;
}

.rss-form * {
  width: fit-content;
  text-align: left;
}
</style>
