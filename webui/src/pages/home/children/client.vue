<template>
  <div class="client">
    <div class="client-div">
      <el-table
        :data="clientList"
        stripe
        style="width: 100%">
        <el-table-column
          prop="id"
          label="ID"
          width="100">
        </el-table-column>
        <el-table-column
          prop="clientAlias"
          label="别名"
          width="144">
        </el-table-column>
        <el-table-column
          prop="enable"
          label="启用"
          width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enable ? '' : 'danger'">{{scope.row.enable}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="type"
          label="客户端类型"
          width="150">
        </el-table-column>
        <el-table-column
          prop="pushMessage"
          label="推送消息"
          width="100">
          <template slot-scope="scope">
            <el-tag>{{scope.row.pushMessage}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="autoDelete"
          label="自动删种"
          width="100">
          <template slot-scope="scope">
            <el-tag>{{scope.row.autoDelete}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          min-width="300">
          <template slot="header" slot-scope="scope">
            <el-switch
              v-model="urlDisplay">
            </el-switch>
            WebUI - Url
          </template>
          <template slot-scope="scope">
            {{ urlDisplay ? scope.row.clientUrl : '**********' }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status ? '' : 'danger'">{{scope.row.enable ? scope.row.status ? '正常' : '连接失败' : '未启用'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="200">
          <template slot-scope="scope">
            <el-button @click="modifyClient(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button @click="deleteClient(scope.row)" :disabled="scope.row.used" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="collapse-div">
        <el-collapse  class="collapse" v-model="clientCollapse">
          <el-collapse-item title="新增 | 编辑 客户端" name="1">
            <div style="width: fit-content; margin: 6px 0 12px 20px">
              <el-tag>客户端 ID: {{client.id || '新增'}}</el-tag>
            </div>
            <el-form ref="client" class="client-form" :model="client" label-width="160px" size="mini">
              <el-form-item required label="别名" prop="clientAlias">
                <el-input v-model="client.clientAlias"></el-input>
              </el-form-item>
              <el-form-item required label="启用" prop="enable">
                <el-checkbox v-model="client.enable">启用</el-checkbox>
              </el-form-item>
              <el-form-item required label="客户端类型" prop="type">
                <el-select v-model="client.type" placeholder="客户端类型">
                  <el-option label="qBittorrent" value="qBittorrent"></el-option>
                  <el-option disabled label="Deluge" value="deluge"></el-option>
                </el-select>
                <div><el-tag type="info">客户端类型, 目前仅支持 qBittorrent</el-tag></div>
              </el-form-item>
              <el-form-item v-if="client.type !== 'deluge'" required label="用户名" prop="username">
                <el-input v-model="client.username"></el-input>
              </el-form-item>
              <el-form-item required label="密码" prop="password">
                <el-input v-model="client.password"></el-input>
              </el-form-item>
              <el-form-item required label="WebUI - Url" prop="clientUrl">
                <el-input v-model="client.clientUrl" style="width: 500px;"></el-input>
              </el-form-item>
              <el-form-item required label="推送消息" prop="pushMessage">
                <el-checkbox v-model="client.pushMessage">推送消息</el-checkbox>
              </el-form-item>
              <el-form-item v-if="client.pushMessage" required label="Telegram Bot" prop="telegram">
                <el-select v-model="client.telegram" placeholder="请选择 Bot">
                  <el-option v-for="bot of botList" :key="bot.id" :label="bot.alias" :value="bot.id"></el-option>
                </el-select>
                <div><el-tag type="info">Telegram Bot, 可在 Telegram 页面创建, 用于推送消息</el-tag></div>
              </el-form-item>
              <el-form-item v-if="client.pushMessage" required label="客户端状态频道" prop="torrentsChannel">
                <el-select v-model="client.torrentsChannel" placeholder="请选择频道">
                  <el-option v-for="channel of channelList" :key="channel.id" :label="channel.alias" :value="channel.id"></el-option>
                </el-select>
                <div><el-tag type="info">客户端状态频道, 用于推送客户端上传下载速度以及各项基本信息</el-tag></div>
              </el-form-item>
              <el-form-item v-if="client.pushMessage" required label="Rss 信息推送频道" prop="notifyChannel">
                <el-select v-model="client.notifyChannel" placeholder="请选择频道">
                  <el-option v-for="channel of channelList" :key="channel.id" :label="channel.alias" :value="channel.id"></el-option>
                </el-select>
                <div><el-tag type="info">Rss 信息推送频道, 用于推送 Rss 相关的通知</el-tag></div>
              </el-form-item>
              <el-form-item required label="信息更新周期" prop="cron">
                <el-input v-model="client.cron" style="width: 500px;"></el-input>
                <div><el-tag type="info">客户端信息更新 Cron 表达式, 默认为 4s 更新一次</el-tag></div>
              </el-form-item>
              <el-form-item required label="自动汇报" prop="autoReannounce">
                <el-checkbox v-model="client.autoReannounce">自动汇报</el-checkbox>
                <div><el-tag type="info">自动在种子添加后的 5 分钟内每分钟汇报一次, 获取更多 Peers</el-tag></div>
              </el-form-item>
              <el-form-item label="上限速度" prop="maxSpeed">
                <el-input v-model="client.maxSpeed">
                  <el-select v-model="client.maxSpeedUnit" slot="append" style="width: 80px" placeholder="单位">
                    <el-option label="KiB/s" value="KiB"></el-option>
                    <el-option label="MiB/s" value="MiB"></el-option>
                    <el-option label="GiB/s" value="GiB"></el-option>
                  </el-select>
                </el-input>
                <div><el-tag type="info">若客户端的上传或下载速度在此速度之上时, 不再添加种子</el-tag></div>
              </el-form-item>
              <el-form-item required label="最大下载数量" prop="maxLeechNum">
                <el-input v-model="client.maxLeechNum" style="width: 500px;"></el-input>
                <div><el-tag type="info">最大的下载活动种子数量, 在超过此数量时, 将不会添加种子</el-tag></div>
              </el-form-item>
              <el-form-item v-if="clientList.length !== 0" label="同服客户端">
                <el-checkbox-group v-model="client.sameServerClients">
                  <el-checkbox v-for="c of clientList" :key="c.id" :label="c.id">{{c.clientAlias}}</el-checkbox>
                </el-checkbox-group>
                <div><el-tag type="info">在统计上限速度时, 计算所有同服客户端的速度和</el-tag></div>
              </el-form-item>
              <el-form-item label="自动删种">
                <el-checkbox v-model="client.autoDelete">自动删种</el-checkbox>
              </el-form-item>
              <el-form-item v-if="client.autoDelete" required label="删种周期" prop="cron">
                <el-input v-model="client.autoDeleteCron" style="width: 500px;"></el-input>
                <div><el-tag type="info">删种周期 Cron 表达式, 默认为 1 分钟更新一次</el-tag></div>
              </el-form-item>
              <el-form-item v-if="client.autoDelete" label="删种规则">
                <el-checkbox-group v-model="client.deleteRules">
                  <el-checkbox v-for="rules of deleteRuleList" :key="rules.id" :label="rules.id">{{rules.alias}}</el-checkbox>
                </el-checkbox-group>
                <div><el-tag  v-if="deleteRuleList.length === 0" type="danger">目前没有删种规则, 如需添加, 请前往 删种规则 页面</el-tag></div>
                <div><el-tag type="info">删种规则, 种子状态符合其中一个时即触发删除种子操作</el-tag></div>
              </el-form-item>
              <el-form-item size="small">
                <el-button type="primary" @click="handleClientClick">新增 | 编辑</el-button>
                <el-button @click="clearClient">清空</el-button>
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
      client: {},
      defaultClient: {
        cron: '*/4 * * * * *',
        autoDeleteCron: '* * * * *',
        pushMessage: true,
        autoReannounce: true,
        autoDelete: true,
        deleteRules: [],
        sameServerClients: []
      },
      urlDisplay: true,
      botList: [],
      channelList: [],
      clientList: [],
      deleteRuleList: [],
      clientCollapse: ['1']
    };
  },
  methods: {
    async handleClientClick () {
      this.$refs.client.validate(async (valid) => {
        if (valid) {
          const url = '/api/client/' + (this.client.id ? 'modify' : 'add');
          const res = await this.$axiosPost(url, this.client);
          if (!res) {
            return;
          }
          await this.$messageBox(res);
          this.listClient();
          this.clearClient();
        } else {
          return false;
        }
      });
    },
    async deleteClient (row) {
      const url = '/api/client/delete';
      const res = await this.$axiosPost(url, {
        id: row.id
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listClient();
      this.clearClient();
    },
    async modifyClient (row) {
      this.clientCollapse = ['1'];
      this.client = { ...row };
    },
    async clearClient () {
      this.client = { ...this.defaultClient };
      this.$refs.client.resetFields();
    },
    async listClient () {
      const res = await this.$axiosGet('/api/client/list');
      this.clientList = res ? res.data : [];
    },
    async listBot () {
      const res = await this.$axiosGet('/api/telegram/listBot');
      this.botList = res ? res.data : [];
    },
    async listChannel () {
      const res = await this.$axiosGet('/api/telegram/listChannel');
      this.channelList = res ? res.data : [];
    },
    async listDeleteRule () {
      const res = await this.$axiosGet('/api/deleteRule/list');
      this.deleteRuleList = res ? res.data : [];
    }
  },
  async mounted () {
    this.client = { ...this.defaultClient };
    this.listClient();
    this.listBot();
    this.listChannel();
    this.listDeleteRule();
  }
};
</script>

<style scoped>
.client-div {
  margin: 20px 0;
}

.collapse-div {
  border-radius: 8px;
  background: #FFFFFF;
}

.collapse {
  margin: 20px;
}

.client-form * {
  width: fit-content;
  text-align: left;
}
</style>
