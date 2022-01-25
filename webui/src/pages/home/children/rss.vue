<template>
  <div class="rss">
    <div class="radius-div">
      <el-table
        :data="rssList"
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
          label="别名"
          width="144">
        </el-table-column>
        <el-table-column
          prop="enable"
          label="启用"
          width="100">
          <template slot-scope="scope">
            <el-tag>{{scope.row.enable}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="客户端"
          width="150">
          <template slot-scope="scope">
            <el-tag>{{(clientList.filter(item => scope.row.client === item.id)[0] || {}).clientAlias}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="推送消息"
          width="100">
          <template slot-scope="scope">
            <el-tag>{{scope.row.pushMessage}}</el-tag>
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
            {{ urlDisplay ? scope.row.rssUrl : '**********' }}
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
            <el-form-item required label="客户端" prop="client">
              <el-select v-model="rss.client" placeholder="客户端">
                <el-option v-for="client of clientList" :disabled="!client.enable" :key="client.id" :label="client.clientAlias" :value="client.id"></el-option>
              </el-select>
              <div><el-tag type="info">选择客户端, 仅可选择已经启用的客户端</el-tag></div>
            </el-form-item>
            <el-form-item required label="Rss - Url" prop="rssUrl">
              <el-input v-model="rss.rssUrl" style="width: 500px;"></el-input>
            </el-form-item>
            <el-form-item v-if="rss.scrapeHr || rss.scrapeFree" label="Cookie" prop="cookie">
              <el-input v-model="rss.cookie" style="width: 500px;"></el-input>
            </el-form-item>
            <el-form-item required label="推送消息" prop="pushMessage">
              <el-checkbox v-model="rss.pushMessage">推送消息</el-checkbox>
            </el-form-item>
            <el-form-item v-if="rss.pushMessage" required label="Telegram Bot" prop="telegram">
              <el-select v-model="rss.telegram" placeholder="请选择 Bot">
                <el-option v-for="bot of botList" :key="bot.id" :label="bot.alias" :value="bot.id"></el-option>
              </el-select>
              <div><el-tag type="info">Telegram Bot, 可在 Telegram 页面创建, 用于推送消息</el-tag></div>
            </el-form-item>
            <el-form-item v-if="rss.pushMessage" required label="Rss 信息推送频道" prop="notifyChannel">
              <el-select v-model="rss.notifyChannel" placeholder="请选择频道">
                <el-option v-for="channel of channelList" :key="channel.id" :label="channel.alias" :value="channel.id"></el-option>
              </el-select>
              <div><el-tag type="info">Rss 信息推送频道, 用于推送 Rss 相关的通知</el-tag></div>
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
              <div><el-tag type="info">限制种子的上传速度</el-tag></div>
            </el-form-item>
            <el-form-item required label="限制下载速度" prop="downloadLimit">
              <el-input v-model="rss.downloadLimit">
                <el-select v-model="rss.downloadLimitUnit" slot="append" style="width: 80px" placeholder="单位">
                  <el-option label="KiB/s" value="KiB"></el-option>
                  <el-option label="MiB/s" value="MiB"></el-option>
                  <el-option label="GiB/s" value="GiB"></el-option>
                </el-select>
              </el-input>
              <div><el-tag type="info">限制种子的下载速度</el-tag></div>
            </el-form-item>
            <el-form-item required label="抓取免费" prop="scrapeFree">
              <el-checkbox v-model="rss.scrapeFree"></el-checkbox>
              <div><el-tag type="info">仅添加免费种子, 仅会在 rss 时判断 1 次, 因此魔力促销类可能不会添加</el-tag></div>
            </el-form-item>
            <el-form-item required label="排除 HR" prop="scrapeHr">
              <el-checkbox v-model="rss.scrapeHr"></el-checkbox>
              <div><el-tag type="info">仅添加非 HR 种子, 仅会在 rss 时判断 1 次</el-tag></div>
            </el-form-item>
            <el-form-item label="等待时间" prop="sleepTime">
              <el-input v-model="rss.sleepTime" style="width: 500px;"></el-input>
              <div><el-tag type="info">在种子发布后的一段时间内不会操作该种, 直到等待时间之后, 再行判断是否添加</el-tag></div>
            </el-form-item>
            <el-form-item v-if="!hideReseed" required label="自动辅种 Beta" prop="autoReseed">
              <el-checkbox v-model="rss.autoReseed"></el-checkbox>
              <div><el-tag type="info">自动辅种已经下载完成的种子, 自动跳检, 属实验性功能, 慎用</el-tag></div>
            </el-form-item>
            <el-form-item v-if="!hideReseed" required label="仅自动辅种" prop="onlyReseed">
              <el-checkbox v-model="rss.onlyReseed"></el-checkbox>
              <div><el-tag type="info">若种子没有匹配自动辅种, 则跳过种子, 不会添加到客户端</el-tag></div>
            </el-form-item>
            <el-form-item v-if="!hideReseed" required label="仅辅种以下客户端" prop="reseedClients">
              <el-checkbox-group v-model="rss.reseedClients">
                <el-checkbox v-for="c of clientList" :disabled="!c.enable" :key="c.id" :label="c.id">{{c.clientAlias}}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag type="info">辅种时仅辅种以上客户端</el-tag></div>
            </el-form-item>
            <el-form-item label="保存路径" prop="savePath">
              <el-input v-model="rss.savePath"></el-input>
              <div><el-tag type="info">保存路径</el-tag></div>
            </el-form-item>
            <el-form-item label="分类" prop="category">
              <el-input v-model="rss.category"></el-input>
              <div><el-tag type="info">分类</el-tag></div>
            </el-form-item>
            <el-form-item label="RFT" prop="rft">
              <el-checkbox v-model="rss.rft">RFT</el-checkbox>
              <div><el-tag type="info">在第一次执行 rss 时拒绝所有种子</el-tag></div>
            </el-form-item>
            <el-form-item label="跳过大小相同种子" prop="skipSameTorrent">
              <el-checkbox v-model="rss.skipSameTorrent">跳过大小相同种子</el-checkbox>
              <div><el-tag type="info">跳过所有客户端内存在大小相同种子的种子</el-tag></div>
            </el-form-item>
            <el-form-item label="Rss规则">
              <el-checkbox-group v-model="rss.rssRules">
                <el-checkbox v-for="rule of rssRuleList" :key="rule.id" :label="rule.id">{{rule.alias}}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag  v-if="rssRuleList.length === 0" type="danger">目前没有 Rss 规则, 如需添加, 请前往 Rss 规则 页面</el-tag></div>
              <div><el-tag type="info">Rss 规则, 种子状态符合其中一个时即触发添加种子操作</el-tag></div>
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
        enable: false,
        scrapeFree: false,
        scrapeHr: false,
        autoReseed: false,
        onlyReseed: false,
        rft: true,
        skipSameTorrent: true,
        cron: '* * * * *',
        pushMessage: true,
        rssRules: [],
        reseedClients: []
      },
      botList: [],
      urlDisplay: true,
      channelList: [],
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
    async clearRss () {
      this.rss = { ...this.defaultRss };
      this.$refs.rss.resetFields();
    },
    async listRss () {
      const res = await this.$axiosGet('/api/rss/list');
      this.rssList = res ? res.data : [];
    },
    async listBot () {
      const res = await this.$axiosGet('/api/telegram/listBot');
      this.botList = res ? res.data : [];
    },
    async listClient () {
      const res = await this.$axiosGet('/api/client/list');
      this.clientList = res ? res.data : [];
    },
    async listChannel () {
      const res = await this.$axiosGet('/api/telegram/listChannel');
      this.channelList = res ? res.data : [];
    },
    async listRssRule () {
      const res = await this.$axiosGet('/api/rssRule/list');
      this.rssRuleList = res ? res.data : [];
    }
  },
  async mounted () {
    window.vue = this;
    this.rss = { ...this.defaultRss };
    await this.listClient();
    this.listRss();
    this.listBot();
    this.listChannel();
    this.listRssRule();
  }
};
</script>

<style scoped>
.rss-div {
  margin: 20px 0;
}

.radius-div {
  border-radius: 8px;
  background: #FFFFFF;
}

.collapse {
  margin: 20px;
}

.rss-form * {
  width: fit-content;
  text-align: left;
}
</style>
