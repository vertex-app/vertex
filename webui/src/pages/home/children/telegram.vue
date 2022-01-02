<template>
  <div class="telegram">
    <div class="telegram-div">
      <el-table
        :data="bot"
        stripe
        style="width: 100%">
        <el-table-column
          prop="id"
          label="ID"
          width="100">
        </el-table-column>
        <el-table-column
          prop="alias"
          label="别名">
        </el-table-column>
        <el-table-column
          prop="token"
          label="Token">
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="200">
          <template slot-scope="scope">
            <el-button @click="modifyBot(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="collapse-div">
        <el-collapse  class="collapse" v-model="botCollapse">
          <el-collapse-item title="新增 | 编辑 Bot" name="1">
            <div style="width: fit-content; margin: 6px 0;">
              <el-tag>bot ID: {{botId}}</el-tag>
            </div>
            <div style="width: fit-content; margin: 6px 0;">
              <el-input
                size="small"
                style="width: 500px"
                placeholder="别名"
                v-model="botAlias">
              </el-input>
            </div>
            <div style="width: fit-content; margin: 6px 0;">
              <el-input
                size="small"
                style="width: 500px"
                placeholder="Token"
                v-model="botToken">
              </el-input>
            </div>
            <div style="width: fit-content; margin: 16px 0 0 0;">
              <el-button @click="handleBotClick" type="primary" size="small">新增 | 编辑</el-button>
              <el-button @click="clearBot" type="primary" size="small">清空</el-button>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
    <div class="telegram-div">
      <el-table
        :data="channel"
        stripe
        style="width: 100%">
        <el-table-column
          prop="id"
          label="ID"
          width="100">
        </el-table-column>
        <el-table-column
          prop="alias"
          label="别名">
        </el-table-column>
        <el-table-column
          prop="channelId"
          label="频道 ID">
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="200">
          <template slot-scope="scope">
            <el-button @click="modifyChannel(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="collapse-div">
        <el-collapse class="collapse" v-model="channelCollapse">
          <el-collapse-item title="新增 | 编辑 频道" name="1">
            <div style="width: fit-content; margin: 6px 0;">
              <el-tag>频道 ID: {{cId}}</el-tag>
            </div>
            <div style="width: fit-content; margin: 6px 0;">
              <el-input
                size="small"
                style="width: 500px"
                placeholder="别名"
                v-model="cAlias">
              </el-input>
            </div>
            <div style="width: fit-content; margin: 6px 0;">
              <el-input
                size="small"
                style="width: 500px"
                placeholder="Token"
                v-model="cId">
              </el-input>
            </div>
            <div style="width: fit-content; margin: 16px 0 0 0;">
              <el-button @click="handleChannelClick" type="primary" size="small">新增 | 编辑</el-button>
              <el-button @click="clearChannel" type="primary" size="small">清空</el-button>
            </div>
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
      botId: '新增',
      botAlias: '',
      botToken: '',
      channelId: '新增',
      cAlias: '',
      cId: '',
      bot: [],
      channel: [],
      botCollapse: ['1'],
      channelCollapse: ['1']
    };
  },
  methods: {
    async handleBotClick () {
      const url = '/api/telegram/' + (this.botId === '新增' ? 'addBot' : 'modifyBot');
      const set = {
        id: this.botId,
        alias: this.botAlias,
        token: this.botToken
      };
      const res = await this.$axiosPost(url, set);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listBot();
      this.clearBot();
    },
    async modifyBot (row) {
      this.botCollapse = ['1'];
      this.botId = row.id;
      this.botAlias = row.alias;
      this.botToken = row.token;
    },
    async clearBot () {
      this.botId = '新增';
      this.botAlias = '';
      this.botToken = '';
    },
    async handleChannelClick () {
      const url = '/api/telegram/' + (this.botId === '新增' ? 'addChannel' : 'modifyChannel');
      const set = {
        id: this.channelId,
        alias: this.cAlias,
        channelId: this.cId
      };
      const res = await this.$axiosPost(url, set);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listChannel();
      this.clearChannel();
    },
    async modifyChannel (row) {
      this.channelCollapse = ['1'];
      this.channelId = row.id;
      this.cAlias = row.alias;
      this.cId = row.channelId;
    },
    async clearChannel () {
      this.channelId = '新增';
      this.cAlias = '';
      this.cId = '';
    },
    async listBot () {
      const res = await this.$axiosGet('/api/telegram/listBot');
      this.bot = res ? res.data : [];
    },
    async listChannel () {
      const res = await this.$axiosGet('/api/telegram/listChannel');
      this.channel = res ? res.data : [];
    }
  },
  async mounted () {
    this.listBot();
    this.listChannel();
  }
};
</script>

<style scoped>
.telegram-div {
  margin: 20px 0;
}

.collapse-div {
  border-radius: 8px;
  background: #FFFFFF;
}

.collapse {
  margin: 20px;
}
</style>
