<template>
  <div class="server">
    <div class="radius-div">
      <el-table
        :data="serverList"
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
          label="别名"
          width="144">
        </el-table-column>
        <el-table-column>
          <template slot="header" slot-scope="scope">
            <el-switch
              v-model="hostDisplay">
            </el-switch>
            IP / 域名
          </template>
          <template slot-scope="scope">
            {{ hostDisplay ? scope.row.host : '**********' }}
          </template>
        </el-table-column>
        <el-table-column>
          <template slot="header" slot-scope="scope">
            <el-switch
              v-model="usernameDisplay">
            </el-switch>
            用户名
          </template>
          <template slot-scope="scope">
            {{ usernameDisplay ? scope.row.username : '**********' }}
          </template>
        </el-table-column>
        <el-table-column
          label="启用"
          width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enable ? '' : 'danger'">{{scope.row.enable}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status ? '' : 'danger'">{{scope.row.status ? '正常' : '连接失败'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="272">
          <template slot-scope="scope">
            <el-button @click="reloadServer(scope.row)" type="warning" size="small">重置连接</el-button>
            <el-button @click="modifyServer(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button @click="deleteServer(scope.row)" :disabled="scope.row.used" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="serverCollapse">
        <el-collapse-item title="新增 | 编辑 服务器" name="1">
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag>服务器 ID: {{server.id || '新增'}}</el-tag>
          </div>
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small" type="warning">
              服务器的 SSH 连接方式信息, Vertex 将通过 SSH 连接执行的方式为首页提供数据
            </el-tag>
          </div>
          <div style="width: fit-content; margin: 6px 0 12px 20px">
            <el-tag size="small" type="danger">
              服务器需安装 sysstat 以及版本为 2.6+ 的 vnstat, 系统语言环境应为英语
            </el-tag>
          </div>
          <el-form ref="server" class="server-form" :model="server" label-width="160px" size="mini">
            <el-form-item required label="别名" prop="alias">
              <el-input v-model="server.alias"></el-input>
            </el-form-item>
            <el-form-item required label="启用" prop="enable">
              <el-checkbox v-model="server.enable">启用</el-checkbox>
            </el-form-item>
            <el-form-item required label="IP / 域名" prop="host">
              <el-input v-model="server.host" style="width: 500px;"></el-input>
              <div><el-tag type="info">IP: 192.168.1.1 或域名: my.seed.box</el-tag></div>
            </el-form-item>
            <el-form-item label="绑定下载器" prop="bindClient">
              <el-select v-model="server.bindClient" placeholder="下载器">
                <el-option v-for="client of clientList" :disabled="!client.enable" :key="client.id" :label="client.alias" :value="client.id"></el-option>
              </el-select>
              <div><el-tag type="info">服务器绑定的下载器, 将在监控页提供链接</el-tag></div>
            </el-form-item>
            <el-form-item required label="用户名" prop="username">
              <el-input v-model="server.username"></el-input>
              <div><el-tag type="info">若不使用脚本功能, 建议填写非 root 账户</el-tag></div>
            </el-form-item>
            <el-form-item required label="密码" prop="password">
              <el-input v-model="server.password"></el-input>
            </el-form-item>
            <el-form-item required label="端口" prop="port">
              <el-input v-model="server.port">端口</el-input>
            </el-form-item>
            <el-form-item label="重连次数" prop="reconnectTime">
              <el-input v-model="server.reconnectTime">重连次数</el-input>
              <div><el-tag type="info">最大的 SSH 自动重连次数, 执行操作遇到错误时会自动重连, 默认为 10</el-tag></div>
            </el-form-item>
            <el-form-item size="small">
              <el-button type="primary" @click="handleServerClick">新增 | 编辑</el-button>
              <el-button @click="clearServer">清空</el-button>
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
      server: {},
      defaultServer: {
        enable: true
      },
      usernameDisplay: true,
      hostDisplay: true,
      serverList: [],
      clientList: [],
      pushList: [],
      serverCollapse: ['1']
    };
  },
  methods: {
    async handleServerClick () {
      this.$refs.server.validate(async (valid) => {
        if (valid) {
          const url = '/api/server/' + (this.server.id ? 'modify' : 'add');
          const res = await this.$axiosPost(url, this.server);
          if (!res) {
            return;
          }
          await this.$messageBox(res);
          this.listServer();
          this.clearServer();
        } else {
          return false;
        }
      });
    },
    async deleteServer (row) {
      const url = '/api/server/delete';
      const res = await this.$axiosPost(url, {
        id: row.id
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.listServer();
      this.clearServer();
    },
    async modifyServer (row) {
      this.serverCollapse = ['1'];
      this.server = row;
    },
    async clearServer () {
      this.server = { ...this.defaultServer };
      this.$refs.server.resetFields();
    },
    async reloadServer (row) {
      const res = await this.$axiosGet('/api/server/reload?id=' + row.id);
      await this.$messageBox(res);
      this.listServer();
    },
    async listServer () {
      const res = await this.$axiosGet('/api/server/list');
      this.serverList = res ? res.data : [];
    },
    async listDeleteRule () {
      const res = await this.$axiosGet('/api/deleteRule/list');
      this.deleteRuleList = res ? res.data : [];
    },
    async listClient () {
      const res = await this.$axiosGet('/api/client/list');
      this.clientList = res ? res.data : [];
    }
  },
  async mounted () {
    this.server = { ...this.defaultServer };
    this.listServer();
    this.listDeleteRule();
    this.listClient();
  }
};
</script>

<style scoped>
.server-div {
  margin: 20px 0;
}

.radius-div {
  border-radius: 8px;
  background: #FFFFFF;
}

.collapse {
  margin: 20px;
}

.server-form * {
  width: fit-content;
  text-align: left;
}
</style>
