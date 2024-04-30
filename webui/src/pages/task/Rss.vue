<template>
  <div style="font-size: 24px; font-weight: bold;">RSS 任务</div>
  <a-divider></a-divider>
  <div class="rss">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="rssList"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">RSS 任务列表</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'enable'">
          <a-switch @change="enableTask(record)" v-model:checked="record.enable" checked-children="启用" un-checked-children="禁用"/>
        </template>
        <template v-if="column.dataIndex === 'clientArr'">
          {{ downloaders.filter(item => record.clientArr.indexOf(item.id) !== -1).map(item => item.alias).join(' / ') }}
        </template>
        <template v-if="column.dataIndex === 'pushNotify'">
          <a-tag color="success" v-if="record.pushNotify">启用</a-tag>
          <a-tag color="error" v-if="!record.pushNotify">禁用</a-tag>
        </template>
        <template v-if="column.title === '操作'">
          <span>
            <a @click="modifyClick(record)">编辑</a>
            <a-divider type="vertical" />
            <a @click="cloneClick(record)">克隆</a>
            <a-divider type="vertical" />
            <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
              <template #content>
                <a-button type="primary" danger @click="deleteRss(record)" size="small">删除</a-button>
              </template>
              <a style="color: red">删除</a>
            </a-popover>
          </span>
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑RSS 任务</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="rss"
        size="small"
        @finish="modifyRss"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给 RSS 任务取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="rss.alias"/>
        </a-form-item>
        <a-form-item
          label="启用"
          name="enable"
          extra="选择是否启用 RSS 任务"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="rss.enable">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="下载器"
          name="clientArr"
          extra="选择下载器, 仅可选择已经启用的下载器"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox-group style="width: 100%;" v-model:value="rss.clientArr">
            <a-row>
              <a-col v-for="downloader of downloaders" :span="8" :key="downloader.id">
                <a-checkbox :disabled="!downloader.enable && !rss.clientArr.includes(downloader.id)" v-model:value="downloader.id">{{ downloader.alias }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          label="排序规则"
          name="clientSortBy"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="rss.clientSortBy">
            <a-select-option value="leechingCount">下载种子数量</a-select-option>
            <a-select-option value="uploadSpeed">当前上传速度</a-select-option>
            <a-select-option value="downloadSpeed">当前下载速度</a-select-option>
            <a-select-option value="freeSpaceOnDisk">当前剩余空间</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="下载器最高上传速度"
          name="maxClientUploadSpeed"
          extra="下载器上传速度在此速度之上时, 不添加种子, 留空或 0 不启用">
          <a-input size="small" v-model:value="rss.maxClientUploadSpeed">
            <template #addonAfter>
              <a-select size="small" v-model:value="rss.maxClientUploadSpeedUnit" placeholder="选择单位" style="width: 120px">
                <a-select-option value="KiB">KiB/s</a-select-option>
                <a-select-option value="MiB">MiB/s</a-select-option>
                <a-select-option value="GiB">GiB/s</a-select-option>
              </a-select>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="下载器最高下载速度"
          name="maxClientDownloadSpeed"
          extra="下载器下载速度在此速度之上时, 不添加种子, 留空或 0 不启用">
          <a-input size="small" v-model:value="rss.maxClientDownloadSpeed">
            <template #addonAfter>
              <a-select size="small" v-model:value="rss.maxClientDownloadSpeedUnit" placeholder="选择单位" style="width: 120px">
                <a-select-option value="KiB">KiB/s</a-select-option>
                <a-select-option value="MiB">MiB/s</a-select-option>
                <a-select-option value="GiB">GiB/s</a-select-option>
              </a-select>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="下载器下载任务上限"
          name="maxClientDownloadCount"
          extra="下载器下载任务之上时, 不添加种子, 留空或 0 不启用">
          <a-input size="small" v-model:value="rss.maxClientDownloadCount">
          </a-input>
        </a-form-item>
        <a-form-item
          label="RssUrl 列表"
          name="rssUrls"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-form-item-rest v-for="(item, index) in rss.rssUrls" :key="index">
            <a-input-group compact>
              <a-input size="small" v-model:value="rss.rssUrls[index]" style="width: calc(100% - 64px)"/>
              <a-button
                type="danger"
                size="small" @click="() => rss.rssUrls = rss.rssUrls.filter(i => i !== rss.rssUrls[index])"
                style="width: 64px;">删除</a-button>
            </a-input-group>
          </a-form-item-rest>
          <a-button
            size="small"
            type="primary"
            @click="rss.rssUrls.push('')"
            >
            新增
          </a-button>
        </a-form-item>
        <a-form-item
          label="抓取免费"
          name="scrapeFree"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="rss.scrapeFree">抓取免费</a-checkbox>
        </a-form-item>
        <a-form-item
          label="排除 HR"
          name="scrapeHr"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="rss.scrapeHr">排除 HR</a-checkbox>
        </a-form-item>
        <a-form-item
          label="Cookie"
          v-if="rss.scrapeHr || rss.scrapeFree"
          name="cookie"
          extra="Cookie, M-Team 为 api key"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="rss.cookie"/>
        </a-form-item>
        <a-form-item
          label="Rss 周期"
          name="cron"
          extra="Rss Cron 表达式, 默认为 1 分钟更新一次"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="rss.cron"/>
        </a-form-item>
        <a-form-item
          label="推送通知"
          name="pushNotify"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="rss.pushNotify">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          v-if="rss.pushNotify"
          label="通知方式"
          name="notify"
          extra="通知方式, 用于推送删种等信息, 在通知工具页面创建"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="rss.notify">
            <a-select-option v-for="notification of notifications" v-model:value="notification.id" :key="notification.id">{{ notification.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="限制上传速度"
          name="uploadLimit"
          extra="限制种子的上传速度, 0 为不限速"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="rss.uploadLimit">
            <template #addonAfter>
              <a-select size="small" v-model:value="rss.uploadLimitUnit" placeholder="选择单位" style="width: 120px">
                <a-select-option value="KiB">KiB/s</a-select-option>
                <a-select-option value="MiB">MiB/s</a-select-option>
                <a-select-option value="GiB">GiB/s</a-select-option>
              </a-select>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="限制下载速度"
          name="downloadLimit"
          extra="限制种子的下载速度, 0 为不限速"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="rss.downloadLimit">
            <template #addonAfter>
              <a-select size="small" v-model:value="rss.downloadLimitUnit" placeholder="选择单位" style="width: 120px">
                <a-select-option value="KiB">KiB/s</a-select-option>
                <a-select-option value="MiB">MiB/s</a-select-option>
                <a-select-option value="GiB">GiB/s</a-select-option>
              </a-select>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="保存路径"
          name="savePath"
          extra="推送种子至下载器时的保存路径">
          <a-input size="small" v-model:value="rss.savePath"/>
        </a-form-item>
        <a-form-item
          label="分类"
          name="category"
          extra="推送种子至下载器时的分类">
          <a-input size="small" v-model:value="rss.category"/>
        </a-form-item>
        <a-form-item
          label="每小时上限"
          name="addCountPerHour"
          extra="每小时向客户端推送种子数量上限, 留空为 20, 编辑 Rss 或重启后重置计数">
          <a-input size="small" v-model:value="rss.addCountPerHour"/>
        </a-form-item>
        <a-form-item
          label="添加种子时暂停"
          name="paused"
          extra="向下载器添加种子时暂停种子">
          <a-checkbox v-model:checked="rss.paused">添加种子时暂停</a-checkbox>
        </a-form-item>
        <a-form-item
          label="自动管理"
          name="autoTMM"
          extra="向下载器添加种子时启用种子的自动管理功能, 不了解请勿勾选">
          <a-checkbox v-model:checked="rss.autoTMM">自动管理</a-checkbox>
        </a-form-item>
        <a-form-item
          label="等待时间"
          name="sleepTime"
          extra="若在 Rss 时种子是非免费状态, 将在种子发布后的一段时间内重复抓取免费状态, 建议等待时间略小于 Rss 周期">
          <a-input size="small" v-model:value="rss.sleepTime"/>
        </a-form-item>
        <a-form-item
          label="最长休眠时间"
          name="maxSleepTime"
          extra="最长休眠时间, 若上次成功 RSS 在 N 秒以前, 则本次 RSS 拒绝所有种子, 建议为 3-5 倍于 Rss 周期, 单位为秒"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="rss.maxSleepTime"/>
        </a-form-item>
        <a-form-item
          label="跳过大小相同种子"
          name="skipSameTorrent"
          extra="跳过所有下载器内存在大小相同种子的种子"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="rss.skipSameTorrent">跳过大小相同种子</a-checkbox>
        </a-form-item>
        <a-form-item
          label="推送种子文件"
          name="pushTorrentFile"
          extra="是否直接推送种子文件, 默认推送种子下载链接至下载器">
          <a-checkbox v-model:checked="rss.pushTorrentFile">推送种子文件</a-checkbox>
        </a-form-item>
        <a-form-item
          label="自定义正则替换"
          v-if="!rss.pushTorrentFile"
          name="useCustomRegex"
          extra="对种子下载链接进行自定义正则表达式替换, 仅在推送方式为推送种子下载链接时生效。不完全理解本功能请勿设置, 不恰当的配置可能导致你的账号被ban。">
          <a-checkbox v-model:checked="rss.useCustomRegex">使用自定义正则</a-checkbox>
        </a-form-item>
        <a-form-item
          label="正则表达式"
          v-if="(!rss.pushTorrentFile) && rss.useCustomRegex"
          name="regexStr"
          extra="格式: /pattern/flags"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="rss.regexStr"/>
        </a-form-item>
        <a-form-item
          label="替换为"
          v-if="(!rss.pushTorrentFile) && rss.useCustomRegex"
          name="replaceStr"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="rss.replaceStr"/>
        </a-form-item>
        <a-form-item
          label="拒绝规则"
          name="rejectRules"
          extra="拒绝规则, 种子状态符合其中一个时即触发拒绝种子操作">
          <a-checkbox-group style="width: 100%;" v-model:value="rss.rejectRules">
            <a-row>
              <a-col v-for="rssRule of rssRules" :span="8" :key="rssRule.id">
                <a-checkbox  v-model:value="rssRule.id">{{ rssRule.alias }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          label="选择规则"
          name="acceptRules"
          extra="选择规则, 种子状态符合其中一个时即触发添加种子操作">
          <a-checkbox-group style="width: 100%;" v-model:value="rss.acceptRules">
            <a-row>
              <a-col v-for="rssRule of rssRules" :span="8" :key="rssRule.id">
                <a-checkbox  v-model:value="rssRule.id">{{ rssRule.alias }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;" @click="clearRss()">清空</a-button>
          <a-button type="primary" style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;" @click="dryrun()">试运行</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
  <a-modal
    v-model:visible="modalVisible"
    title="RSS 试运行"
    width="1440px"
    :footer="null">
    <div style="text-align: left; ">
      <a-alert message="注意事项" type="info" >
        <template #description>
          RSS 试运行仅判断是否符合 RSS 规则，不检测种子免费或 HR 状态。
          <br>
          RSS 链接: {{ rss.rssUrls[0] }}
        </template>
      </a-alert>
      <a-form
        labelAlign="right"
        :labelWrap="true"
        size="small"
        :labelCol="{ span: 6 }"
        :wrapperCol="{ span: 18 }"
        autocomplete="off">
        <a-form-item
          :wrapperCol="{ span:24 }">
          <a-table
            :style="`font-size: ${isMobile() ? '12px': '14px'};`"
            :columns="dryrunColumns"
            size="small"
            :data-source="dryrunResult"
            :pagination="false"
            :scroll="{ x: 960 }"
          >
            <template #title>
              <span style="font-size: 16px; font-weight: bold;">种子列表</span>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'size'">
                {{ $formatSize(record.size) }}
              </template>
            </template>
          </a-table>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 6, offset: 18 }">
          <a-button @click="() => modalVisible = false">取消</a-button>
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>
<script>
export default {
  data () {
    const columns = [
      {
        title: 'ID',
        dataIndex: 'id',
        width: 18,
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
        title: '下载器',
        dataIndex: 'clientArr',
        width: 40
      }, {
        title: '推送消息',
        dataIndex: 'pushNotify',
        width: 20
      }, {
        title: '操作',
        width: 28
      }
    ];
    const dryrunColumns = [
      {
        title: '种子标题',
        dataIndex: 'name',
        width: 144
      }, {
        title: '种子大小',
        dataIndex: 'size',
        width: 14
      }, {
        title: '结果',
        dataIndex: 'status',
        width: 28
      }
    ];
    return {
      columns,
      dryrunColumns,
      modalVisible: false,
      rssList: [],
      downloaders: [],
      notifications: [],
      rssRules: [],
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
        pushTorrentFile: true,
        cron: '* * * * *',
        addCountPerHour: '',
        pushNotify: false,
        acceptRules: [],
        rejectRules: [],
        reseedClients: [],
        rssUrls: ['']
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
    async listRss () {
      try {
        const res = await this.$api().rss.list();
        this.rssList = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async listNotification () {
      try {
        const res = await this.$api().notification.list();
        this.notifications = res.data.sort((a, b) => a.alias.localeCompare(b.alias));
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async listRssRule () {
      try {
        const res = await this.$api().rssRule.list();
        this.rssRules = res.data.sort((a, b) => a.alias.localeCompare(b.alias));
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async listDownloader () {
      try {
        const res = await this.$api().downloader.list();
        this.downloaders = res.data.sort((a, b) => a.alias.localeCompare(b.alias));
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modifyRss () {
      try {
        await this.$api().rss.modify({ ...this.rss });
        this.$message().success((this.rss.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listRss(), 1000);
        this.clearRss();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async dryrun () {
      try {
        const res = await this.$api().rss.dryrun({ ...this.rss });
        this.dryrunResult = res.data;
        this.modalVisible = true;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async enableTask (record) {
      try {
        await this.$api().rss.modify({ ...record });
        this.$message().success('修改成功, 列表正在刷新...');
        setTimeout(() => this.listRss(), 1000);
        this.clearRss();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      this.rss = { ...row };
    },
    cloneClick (row) {
      this.rss = JSON.parse(JSON.stringify(row));
      this.rss.id = null;
      this.rss.alias = this.rss.alias + '-克隆';
    },
    async deleteRss (row) {
      try {
        await this.$api().rss.delete(row.id);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listRss();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    clearRss () {
      this.rss = {
        ...this.defaultRss,
        acceptRules: [],
        clientArr: [],
        rejectRules: [],
        reseedClients: [],
        rssUrls: ['']
      };
    }
  },
  async mounted () {
    this.clearRss();
    this.listNotification();
    this.listDownloader();
    this.listRssRule();
    this.listRss();
  }
};
</script>
<style scoped>
.rss {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
