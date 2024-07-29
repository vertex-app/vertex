<template>
  <div style="font-size: 24px; font-weight: bold;">下载器</div>
  <a-divider></a-divider>
  <div class="downloader">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="downloaders"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">下载器列表</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'enable'">
          <a-switch @change="enableDownloader(record)" :disabled="record.used" v-model:checked="record.enable" checked-children="启用" un-checked-children="禁用"/>
        </template>
        <template v-if="column.dataIndex === 'autoDelete'">
          <a-tag color="success" v-if="record.autoDelete">启用</a-tag>
          <a-tag color="error" v-if="!record.autoDelete">禁用</a-tag>
        </template>
        <template v-if="column.dataIndex === 'status'">
          <a-tag color="success" v-if="record.status">正常</a-tag>
          <a-tag color="error" v-if="!record.status">异常</a-tag>
        </template>
        <template v-if="column.title === '操作'">
          <span>
            <a @click="goto(record)">打开</a>
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
                    <a @click="cloneClick(record)">克隆</a>
                  </a-menu-item>
                  <a-menu-item>
                    <a @click="gotoLog(record)">日志</a>
                  </a-menu-item>
                  <a-menu-item danger>
                    <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
                      <template #content>
                        <a-button type="primary" danger @click="deleteDownloader(record)" size="small">删除</a-button>
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
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑下载器</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="downloader"
        size="small"
        @finish="modifyDownloader"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给下载器取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="downloader.alias"/>
        </a-form-item>
        <a-form-item
          label="启用"
          name="enable"
          extra="选择是否启用下载器"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox :disabled="downloader.used" v-model:checked="downloader.enable">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="下载器类型"
          name="type"
          extra="下载器类型, 目前完整支持 qBittorrent, Deluge 和 Transmission 不完全支持"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="downloader.type"  >
            <a-select-option value="qBittorrent">qBittorrent</a-select-option>
            <a-select-option value="Transmission">Transmission</a-select-option>
            <a-select-option value="deluge">Deluge</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="用户名"
          name="username"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="downloader.username"/>
        </a-form-item>
        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="downloader.password"/>
        </a-form-item>
        <a-form-item
          label="URL"
          name="clientUrl"
          extra="下载器的链接, 最后的 / 需要删除"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="downloader.clientUrl"/>
        </a-form-item>
        <a-form-item
          label="推送通知"
          name="pushNotify"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="downloader.pushNotify">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          v-if="downloader.pushNotify"
          label="通知方式"
          name="notify"
          extra="通知方式, 用于推送删种等信息, 在通知工具页面创建"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="downloader.notify">
            <a-select-option v-for="notification of notifications" v-model:value="notification.id" :key="notification.id">{{ notification.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="监控频道"
          name="pushMonitor"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="downloader.pushMonitor">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          v-if="downloader.pushMonitor"
          label="监控频道"
          name="monitor"
          extra="下载器状态频道, 仅支持 Telegram! 在推送工具页面创建"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="downloader.monitor">
            <a-select-option
              :disabled="notification.type !== 'telegram'"
              v-for="notification of notifications"
              v-model:value="notification.id"
              :key="notification.id">
              {{ notification.alias }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="信息更新周期"
          name="cron"
          extra="下载器信息更新 Cron 表达式, 默认为 4s 更新一次, 种子量过多请考虑 一分钟 一次甚至 五分钟 一次"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="downloader.cron"/>
        </a-form-item>
        <a-form-item
          label="自动汇报"
          name="autoReannounce"
          extra="自动在种子添加后的第 5 分钟时汇报一次, 获取更多 Peers"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="downloader.autoReannounce">自动汇报</a-checkbox>
        </a-form-item>
        <a-form-item
          label="先下载首尾文件块"
          name="firstLastPiecePrio"
          extra="先下载首尾文件块, 同 qBittorrent 右键菜单 - 先下载首尾文件块">
          <a-checkbox v-model:checked="downloader.firstLastPiecePrio">先下载首尾文件块</a-checkbox>
        </a-form-item>
        <a-form-item
          label="空间警告"
          name="spaceAlarm"
          extra="下载器剩余空间小于一定值时推送警告通知, 15 分钟一次"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="downloader.spaceAlarm">空间警告</a-checkbox>
        </a-form-item>
        <a-form-item
          v-if="downloader.spaceAlarm"
          label="空间"
          name="alarmSpace"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="downloader.alarmSpace">
            <template #addonAfter>
              <a-select size="small" v-model:value="downloader.alarmSpaceUnit" placeholder="选择单位" style="width: 120px">
                <a-select-option value="KiB">KiB</a-select-option>
                <a-select-option value="MiB">MiB</a-select-option>
                <a-select-option value="GiB">GiB</a-select-option>
              </a-select>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="上限上传速度"
          name="maxUploadSpeed"
          extra="若下载器的上传速度在此速度之上时, 不再添加种子">
          <a-input size="small" v-model:value="downloader.maxUploadSpeed">
            <template #addonAfter>
              <a-select size="small" v-model:value="downloader.maxUploadSpeedUnit" placeholder="选择单位" style="width: 120px">
                <a-select-option value="KiB">KiB/s</a-select-option>
                <a-select-option value="MiB">MiB/s</a-select-option>
                <a-select-option value="GiB">GiB/s</a-select-option>
              </a-select>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="上限下载速度"
          name="maxDownloadSpeed"
          extra="若下载器的下载速度在此速度之上时, 不再添加种子">
          <a-input size="small" v-model:value="downloader.maxDownloadSpeed">
            <template #addonAfter>
              <a-select size="small" v-model:value="downloader.maxDownloadSpeedUnit" placeholder="选择单位" style="width: 120px">
                <a-select-option value="KiB">KiB/s</a-select-option>
                <a-select-option value="MiB">MiB/s</a-select-option>
                <a-select-option value="GiB">GiB/s</a-select-option>
              </a-select>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="最小剩余空间"
          name="minFreeSpace"
          extra="若下载器的剩余空间在此空间之下时, 不再添加种子">
          <a-input size="small" v-model:value="downloader.minFreeSpace">
            <template #addonAfter>
              <a-select size="small" v-model:value="downloader.minFreeSpaceUnit" placeholder="选择单位" style="width: 120px">
                <a-select-option value="KiB">KiB</a-select-option>
                <a-select-option value="MiB">MiB</a-select-option>
                <a-select-option value="GiB">GiB</a-select-option>
              </a-select>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="最大下载数量"
          name="maxLeechNum"
          extra="最大的下载活动种子数量, 在超过此数量时, 将不会添加种子">
          <a-input size="small" v-model:value="downloader.maxLeechNum"/>
        </a-form-item>
        <a-form-item
          label="自动删种"
          name="autoDelete"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="downloader.autoDelete">自动删种</a-checkbox>
        </a-form-item>
        <a-form-item
          v-if="downloader.autoDelete"
          label="删种周期"
          name="autoDeleteCron"
          extra="删种周期 Cron 表达式, 默认为 1 分钟更新一次"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="downloader.autoDeleteCron"/>
        </a-form-item>
        <a-form-item
          v-if="downloader.autoDelete"
          label="拒绝删种规则"
          name="rejectDeleteRules"
          extra="拒绝删种规则, 种子状态符合其中一个时该种子不会被删除">
          <a-checkbox-group style="width: 100%;" v-model:value="downloader.rejectDeleteRules">
            <a-row>
              <a-col v-for="deleteRule of deleteRules" :span="8" :key="deleteRule.id">
                <a-checkbox  v-model:value="deleteRule.id">{{ deleteRule.alias }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          v-if="downloader.autoDelete"
          label="删种规则"
          name="deleteRules"
          extra="删种规则, 种子状态符合其中一个时即触发删除种子操作"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox-group style="width: 100%;" v-model:value="downloader.deleteRules">
            <a-row>
              <a-col v-for="deleteRule of deleteRules" :span="8" :key="deleteRule.id">
                <a-checkbox  v-model:value="deleteRule.id">{{ deleteRule.alias }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;"  @click="clearDownloader()">清空</a-button>
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
        width: 20
      }, {
        title: '启用',
        dataIndex: 'enable',
        width: 15
      }, {
        title: 'URL',
        dataIndex: 'clientUrl',
        width: 40
      }, {
        title: '自动删种',
        dataIndex: 'autoDelete',
        width: 15
      }, {
        title: '状态',
        dataIndex: 'status',
        width: 15
      }, {
        title: '操作',
        width: 28
      }
    ];
    return {
      columns,
      downloaders: [],
      notifications: [],
      deleteRules: [],
      downloader: {},
      defaultDownloader: {
        id: '',
        alias: '',
        host: '',
        username: '',
        password: '',
        port: '',
        enable: true,
        pushNotify: false,
        pushMonitor: false,
        spaceAlarm: false,
        firstLastPiecePrio: true,
        cron: '*/4 * * * * *',
        autoDeleteCron: '* * * * *',
        autoReannounce: true,
        autoDelete: true,
        deleteRules: []
      },
      loading: true,
      registCode: []
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
    async listDownloader () {
      try {
        const res = await this.$api().downloader.list();
        this.downloaders = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async listNotification () {
      try {
        const res = await this.$api().notification.list();
        this.notifications = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async listDeleteRule () {
      try {
        const res = await this.$api().deleteRule.list();
        this.deleteRules = res.data.sort((a, b) => a.alias.localeCompare(b.alias));
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modifyDownloader () {
      try {
        await this.$api().downloader.modify({ ...this.downloader });
        this.$message().success((this.downloader.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listDownloader(), 1000);
        this.clearDownloader();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      this.downloader = { ...row };
    },
    cloneClick (row) {
      this.downloader = { ...row, deleteRules: [...row.deleteRules] };
      this.downloader.id = null;
      this.downloader.alias = this.downloader.alias + '-克隆';
    },
    async deleteDownloader (row) {
      if (row.used) {
        this.$message().error('组件被占用, 取消占用后删除');
        return;
      }
      try {
        await this.$api().downloader.delete(row.id);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listDownloader();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async enableDownloader (record) {
      try {
        await this.$api().downloader.modify({ ...record });
        this.$message().success('修改成功, 列表正在刷新...');
        setTimeout(() => this.listDownloader(), 1000);
        this.clearDownloader();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    goto (record) {
      window.open(`/proxy/client/${record.id}/`);
    },
    gotoLog (record) {
      window.open(`/tool/clientLog?id=${record.id}`);
    },
    clearDownloader () {
      this.downloader = {
        ...this.defaultDownloader,
        deleteRules: []
      };
    }
  },
  async mounted () {
    this.clearDownloader();
    this.listDeleteRule();
    this.listNotification();
    this.listDownloader();
  }
};
</script>
<style scoped>
.downloader {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
