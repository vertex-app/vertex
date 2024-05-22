<template>
  <div style="font-size: 24px; font-weight: bold;">通知工具</div>
  <a-divider></a-divider>
  <div class="notification">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="notifications"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">通知工具列表</span>
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
            <a @click="modifyClick(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
              <template #content>
                <a-button type="primary" danger @click="deleteNotification(record)" size="small">删除</a-button>
              </template>
              <a style="color: red">删除</a>
            </a-popover>
          </span>
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑通知工具</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="notification"
        size="small"
        @finish="modifyNotification"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给通知工具取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="notification.alias"/>
        </a-form-item>
        <a-form-item
          label="错误推送上限"
          name="maxErrorCount"
          extra="单个周期内推送错误信息次数上限, 仅计算错误信息推送, 留空为 100">
          <a-input size="small" v-model:value="notification.maxErrorCount"/>
        </a-form-item>
        <a-form-item
          label="重置周期"
          name="clearCountCron"
          extra="Crontab 表达式, 在每次触发时重置推送错误信息次数为 0, 留空为 0 * * * *">
          <a-input size="small" v-model:value="notification.clearCountCron"/>
        </a-form-item>
        <a-form-item
          label="类型"
          name="type"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="notification.type"  >
            <a-select-option value="telegram">Telegram</a-select-option>
            <a-select-option value="wechat">WeChat</a-select-option>
            <a-select-option value="slack">Slack</a-select-option>
            <a-select-option value="ntfy">Ntfy</a-select-option>
            <a-select-option value="webhook">Webhook</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'wechat'"
          label="企业 ID"
          name="corpid"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="notification.corpid"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'wechat'"
          label="Agent ID"
          name="agentid"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="notification.agentid"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'wechat'"
          label="Secret"
          name="corpsecret"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="notification.corpsecret"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'wechat'"
          label="ProxyKey"
          name="proxyKey">
          <a-input size="small" v-model:value="notification.proxyKey"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'telegram'"
          label="机器人 Token"
          name="telegramBotToken"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="notification.telegramBotToken"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'telegram'"
          label="频道 ID"
          name="telegramChannel"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="notification.telegramChannel"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'ntfy'"
          label="Ntfy URL"
          name="ntfyUrl"
          extra="格式: https://ntfy.sh/mytopic"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="notification.ntfyUrl"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'ntfy'"
          label="用户名"
          name="ntfyUsername">
          <a-input size="small" v-model:value="notification.ntfyUsername"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'ntfy'"
          label="密码"
          name="ntfyPassword">
          <a-input size="small" v-model:value="notification.ntfyPassword"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'ntfy'"
          label="Token"
          name="ntfyToken"
          extra="使用Token或用户名+密码进行认证">
          <a-input size="small" v-model:value="notification.ntfyToken"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'ntfy'"
          label="优先级"
          name="ntfyPriority"
          extra="5最高, 1最低, 不填写为默认值3">
          <a-input size="small" v-model:value="notification.ntfyPriority"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'slack'"
          label="Webhook"
          name="slackWebhook"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="notification.slackWebhook"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'slack'"
          label="Token"
          name="slackToken"
          extra="如果仅使用推送通知功能，可随意填写内容"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="notification.slackToken"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'webhook'"
          label="Url"
          name="webhookurl"
          extra="填写目标地址, 请注意推送内容中包含敏感信息, 因此必须保证目标地址可信"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="notification.webhookurl"/>
        </a-form-item>
        <a-form-item
          v-if="notification.type === 'webhook'"
          label="Token"
          name="token"
          extra="在请求时会将 token 放入请求头的 x-vertex-token 中"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="notification.token"/>
        </a-form-item>
        <a-form-item
          label="推送类型"
          name="pushType"
          extra="只有已被勾选的项目才会推送"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox-group style="width: 100%;" v-model:value="notification.pushType">
            <a-row>
              <a-col v-for="type of pushType" :span="8" :key="type.key">
                <a-checkbox  v-model:value="type.key">{{ type.value }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;" @click="clearNotification()">清空</a-button>
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
        title: '推送类型',
        dataIndex: 'type',
        width: 30
      }, {
        title: '操作',
        width: 20
      }
    ];
    return {
      columns,
      notifications: [],
      notification: [],
      pushType: [
        {
          key: 'rssError',
          value: 'Rss 失败'
        }, {
          key: 'scrapeError',
          value: '抓取免费或 HR 失败'
        }, {
          key: 'addTorrent',
          value: '添加种子'
        }, {
          key: 'addTorrentError',
          value: '添加种子失败'
        }, {
          key: 'rejectTorrent',
          value: '拒绝种子'
        }, {
          key: 'deleteTorrent',
          value: '删除种子'
        }, {
          key: 'deleteTorrentError',
          value: '删除种子失败'
        }, {
          key: 'reannounceTorrent',
          value: '重新汇报种子'
        }, {
          key: 'reannounceTorrentError',
          value: '重新汇报种子失败'
        }, {
          key: 'connectClient',
          value: '下载器已连接'
        }, {
          key: 'clientLoginError',
          value: '下载器登陆失败'
        }, {
          key: 'getMaindataError',
          value: '获取下载器信息失败'
        }, {
          key: 'spaceAlarm',
          value: '空间警告'
        }, {
          key: 'plexWebhook',
          value: 'Plex 通知'
        }, {
          key: 'embyWebhook',
          value: 'Emby 通知'
        }, {
          key: 'jellyfinWebhook',
          value: 'Jellyfin 通知'
        }, {
          key: 'selectWish',
          value: '选择想看 (微信交互)'
        }, {
          key: 'addDoubanTorrent',
          value: '添加追剧种子'
        }, {
          key: 'addDoubanTorrentError',
          value: '添加追剧种子失败'
        }, {
          key: 'torrentFinish',
          value: '追剧种子已完成'
        }, {
          key: 'selectTorrentError',
          value: '追剧搜索种子失败'
        }, {
          key: 'addDouban',
          value: '添加追剧任务'
        }, {
          key: 'startRefreshWish',
          value: '刷新追剧任务'
        }, {
          key: 'startRefreshWishError',
          value: '刷新追剧任务失败'
        }, {
          key: 'addDoubanWish',
          value: '添加追剧项目'
        }, {
          key: 'scrapeTorrent',
          value: '识别种子'
        }, {
          key: 'scrapeTorrentFailed',
          value: '识别种子失败'
        }, {
          key: 'finish',
          value: '追剧种子完成'
        }, {
          key: 'watch',
          value: '监控分类'
        }
      ],
      defaultNotification: {
        id: '',
        pushType: []
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
    async listNotification () {
      try {
        const res = await this.$api().notification.list();
        this.notifications = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modifyNotification () {
      try {
        await this.$api().notification.modify({ ...this.notification });
        this.$message().success((this.notification.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listNotification(), 1000);
        this.clearNotification();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      this.notification = { ...row, pushType: this.pushType.map(item => item.key).filter(item => row.pushType.indexOf(item) !== -1) };
    },
    clearNotification () {
      this.notification = { ...this.defaultNotification, pushType: [] };
    },
    async deleteNotification (row) {
      if (row.used) {
        this.$message().error('组件被占用, 取消占用后删除');
        return;
      }
      try {
        await this.$api().notification.delete(row.id);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listNotification();
      } catch (e) {
        this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    this.clearNotification();
    await this.listNotification();
  }
};
</script>
<style scoped>
.notification {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
