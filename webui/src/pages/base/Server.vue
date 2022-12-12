<template>
  <div style="font-size: 24px; font-weight: bold;">服务器</div>
  <a-divider></a-divider>
  <div class="server">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="servers"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">服务器列表</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'enable'">
          <a-tag color="success" v-if="record.enable">启用</a-tag>
          <a-tag color="error" v-if="!record.enable">禁用</a-tag>
        </template>
        <template v-if="column.dataIndex === 'status'">
          <a-tag color="success" v-if="record.status">正常</a-tag>
          <a-tag color="error" v-if="!record.status">异常</a-tag>
        </template>
        <template v-if="column.title === '操作'">
          <span>
            <a @click="goto(record)">shell</a>
            <a-divider type="vertical" />
            <a-dropdown>
              <a class="ant-dropdown-link" @click.prevent>
                操作
                <fa :icon="['fas', 'chevron-down']"></fa>
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item>
                    <a @click="modifyClick(record)">编辑</a>
                  </a-menu-item>
                  <a-menu-item>
                    <a @click="reloadServer(record)">重连</a>
                  </a-menu-item>
                  <a-menu-item danger>
                    <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
                      <template #content>
                        <a-button type="primary" danger @click="deleteServer(record)" size="small">删除</a-button>
                      </template>
                      <a>删除</a>
                    </a-popover>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </span>
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑服务器</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="server"
        size="small"
        @finish="modifyServer"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给服务器取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="server.alias"/>
        </a-form-item>
        <a-form-item
          label="启用"
          name="enable"
          extra="选择是否启用服务器"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox :disabled="server.used" v-model:checked="server.enable">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="域名/IP"
          name="host"
          extra="服务器的 IP: 192.168.1.1 或域名: my.seed.box"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="server.host"/>
        </a-form-item>
        <a-form-item
          label="用户名"
          name="username"
          extra="填写 ssh 登录服务器所需的用户名"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="server.username"/>
        </a-form-item>
        <a-form-item
          label="密码"
          name="password"
          extra="填写 ssh 登录服务器所需的密码, 密码与密钥二选一即可。"
          :rules="[{ validator: async (rule, value) => { if (server.password || server.privateKey) return; throw '密码和密钥至少填写一个!' } }]">
          <a-input size="small" v-model:value="server.password"/>
        </a-form-item>
        <a-form-item
          label="密钥"
          name="privateKey"
          extra="填写 ssh 登录服务器所需的密钥, 密码与密钥二选一即可。"
          :rules="[{ validator: async (rule, value) => { if (server.password || server.privateKey) return; throw '密码和密钥至少填写一个!' } }]">
          <a-textarea v-model:value="server.privateKey" type="textarea" :rows="10"></a-textarea >
        </a-form-item>
        <a-form-item
          label="端口"
          name="port"
          extra="填写 ssh 登录服务器所需的端口"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="server.port"/>
        </a-form-item>
        <a-form-item
          label="固定网卡"
          name="fixedInterface"
          extra="填写希望显示速度信息的网卡接口, 例: enp1s0">
          <a-input size="small" v-model:value="server.fixedInterface"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;" @click="clearServer()">清空</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    const columns = [
      {
        title: 'ID',
        dataIndex: 'id',
        width: 18,
        sorter: (a, b) => a.id.localeCompare(b.id),
        fixed: true
      }, {
        title: '别名',
        dataIndex: 'alias',
        sorter: (a, b) => a.alias.localeCompare(b.alias),
        defaultSortOrder: 'ascend',
        width: 30
      }, {
        title: '域名/IP',
        dataIndex: 'host',
        width: 30
      }, {
        title: '启用',
        dataIndex: 'enable',
        width: 15
      }, {
        title: '状态',
        dataIndex: 'status',
        width: 15
      }, {
        title: '操作',
        width: 24
      }
    ];
    return {
      columns,
      servers: [],
      server: {},
      defaultServer: {
        id: '',
        alias: '',
        host: '',
        username: '',
        password: '',
        port: '',
        enable: true
      },
      loading: true
    };
  },
  methods: {
    isMobile () {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
      } else {
        return false;
      }
    },
    async listServer () {
      try {
        const res = await this.$api().server.list();
        this.servers = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modifyServer () {
      try {
        await this.$api().server.modify({ ...this.server });
        this.$message().success((this.server.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listServer(), 1000);
        this.clearServer();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async reloadServer (row) {
      try {
        const res = await this.$api().server.reload(row.id);
        this.$message().success(res.message);
        this.listServer();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async clearServer () {
      this.server = { ...this.defaultServer };
    },
    modifyClick (row) {
      this.server = { ...row };
    },
    async deleteServer (row) {
      if (row.used) {
        this.$message().error('组件被占用, 取消占用后删除');
        return;
      }
      try {
        await this.$api().server.delete(row.id);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listServer();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    goto (record) {
      window.open('/tool/shell/' + record.id);
    }
  },
  async mounted () {
    this.clearServer();
    await this.listServer();
  }
};
</script>
<style scoped>
.server {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
