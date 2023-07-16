<template>
  <div style="font-size: 24px; font-weight: bold;">删种规则</div>
  <a-divider></a-divider>
  <div class="delete-rule">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="deleteRuleList"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">删种规则列表</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'type'">
          {{ record.type === 'normal' ? '普通' : 'JavaScript'}}
        </template>
        <template v-if="column.title === '操作'">
          <span>
            <a @click="modifyClick(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
              <template #content>
                <a-button type="primary" danger @click="deleteDeleteRule(record)" size="small">删除</a-button>
              </template>
              <a style="color: red">删除</a>
            </a-popover>
          </span>
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑删种规则</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="deleteRule"
        size="small"
        @finish="modifyDeleteRule"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给删种规则取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="deleteRule.alias"/>
        </a-form-item>
        <a-form-item
          label="持续时间"
          name="fitTime"
          extra="符合删种规则的持续时间, 只有到达持续时间之后才会删种, 单位为 秒, 不启用留空, 建议考虑下载器的删种周期一起设置">
          <a-input size="small" v-model:value="deleteRule.fitTime"/>
        </a-form-item>
        <a-form-item
          label="优先级"
          name="priority"
          extra="优先级越高的规则越先执行, 默认为 0">
          <a-input size="small" v-model:value="deleteRule.priority"/>
        </a-form-item>
        <a-form-item
          label="单次删种数量"
          name="deleteNum"
          extra="单次删种任务的删除种子的数量, 不同规则间不累计, 留空为单次只删除一个">
          <a-input size="small" v-model:value="deleteRule.deleteNum"/>
        </a-form-item>
        <a-form-item
          label="暂停种子"
          name="pause"
          extra="默认为删除种子，启用该选项后用暂停种子替代，其它流程照旧">
          <a-checkbox v-model:checked="deleteRule.pause">暂停种子</a-checkbox>
        </a-form-item>
        <a-form-item
          label="仅删除种子"
          name="onlyDeleteTorrent"
          extra="仅删除种子，若勾选，删除种子时不删除文件">
          <a-checkbox v-model:checked="deleteRule.onlyDeleteTorrent">仅删除种子</a-checkbox>
        </a-form-item>
        <a-form-item
          label="限制下载速度"
          name="limitSpeed"
          extra="默认为删除种子，启用该选项后用限制种子下载速度替代, 优先级高于暂停种子及删除种子, 单位为字节每秒 Byte/s, 留空为不启用">
          <a-input size="small" v-model:value="deleteRule.limitSpeed"/>
        </a-form-item>
        <a-form-item
          label="类型"
          name="type"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="deleteRule.type"  >
            <a-select-option value="normal">普通</a-select-option>
            <a-select-option value="javascript">JavaScript</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="限制条件"
          v-if="deleteRule.type === 'normal'"
          name="conditions"
          extra="关于各个条件的介绍，可以查看下方的说明"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-table
            :style="`font-size: ${isMobile() ? '12px': '14px'};`"
            :columns="conditionColumns"
            size="small"
            :data-source="deleteRule.conditions"
            :pagination="false"
            :scroll="{ x: 540 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'key'">
                <a-select size="small" v-model:value="record.key"  >
                  <a-select-option v-for="conditionKey of conditionKeys" :key="conditionKey.key" :value="conditionKey.key">{{ conditionKey.name }}</a-select-option>
                </a-select>
              </template>
              <template v-if="column.dataIndex === 'compareType'">
                <a-select size="small" v-model:value="record.compareType"  >
                  <a-select-option value="equals">等于</a-select-option>
                  <a-select-option value="bigger">大于</a-select-option>
                  <a-select-option value="smaller">小于</a-select-option>
                  <a-select-option value="contain">包含</a-select-option>
                  <a-select-option value="includeIn">包含于</a-select-option>
                  <a-select-option value="notContain">不包含</a-select-option>
                  <a-select-option value="notIncludeIn">不包含于</a-select-option>
                  <a-select-option value="regExp">正则匹配</a-select-option>
                  <a-select-option value="notRegExp">正则不匹配</a-select-option>
                </a-select>
              </template>
              <template v-if="column.dataIndex === 'value'">
                <a-input size="small" v-model:value="record.value"/>
              </template>
              <template v-if="column.dataIndex === 'option'">
                <a style="color: red" @click="deleteRule.conditions = deleteRule.conditions.filter(item => item !== record)">删除</a>
              </template>
            </template>
          </a-table>
          <a-button
            type="primary"
            @click="deleteRule.conditions.push({ ...condition })"
            size="small"
            >
            新增条件
          </a-button>
        </a-form-item>
        <a-form-item
          v-if="deleteRule.type === 'javascript'"
          name="code"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          label="自定义代码">
          <a-textarea  v-model:value="deleteRule.code" type="textarea" :rows="10"></a-textarea >
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;" @click="clearDeleteRule()">清空</a-button>
        </a-form-item>
      </a-form>
      <a-divider></a-divider>
      <a-descriptions
        title="说明"
        :column="1"
        >
        <!--
          01. 分享率一: 上传 / 种子大小 的结果<br>
          02. 分享率二: 上传 / 下载 的结果<br>
          03. 站点域名: 种子的 Tracker 地址的域名部分<br>
          04. 各类时间: 选项时间到当前时间的差值, 单位为 秒/s<br>
          05. 各类大小: 单位为 字节 / Byte, 可以使用 * 做乘法运算<br>
          06. 各类速度: 单位为 字节/s / Byte/s<br>
          07. 种子状态: 参照 qBittorrent 对种子状态的定义, 主要包含以下几类: <br>
              上传中: `uploading`, 下载中: `downloading`
              等待下载: `stalledDL`, 做种但无上传: `stalledUP`
              更多状态请参照 qBittorrent Wiki, 若想删除等待下载状态下的种子, 应填写 `stalledDL`
          08. 返回信息: 种子 Tracker 列表中由 Tracker 返回的信息<br>
          09. 当前时间: 当天 0 点到当前时间的秒数<br>
              例: 填写 当前时间大于 8\*3600 与 当前时间小于 22\*3600<br>
              则只会在当天上午 8 点之后到 22 点之前删种<br>
              0 点的时间戳取决于 Vertex 安装环境的时区<br>
          10. 全局速度: 当前下载器的速度<br>
          11. 做种下载连接: 仅计算已连接上的数量, 也即 qBittorrent WebUI 内括号外的数字 <br>
          12. 做种下载任务: 任务的数量, 做种包含上传中状态与做种状态, 下载包含下载中与等待下载状态 <br>
          13. 比较类型中的 包含 / 包含于 或 不包含 / 不包含于: 值部分需以半角逗号 , 为分割符, 如种子分类不包含于 KEEP, KEEP2, KEEP3 三个分类, 则应填写:
              `KEEP,KEEP2,KEEP3`
          -->
        <a-descriptions-item label="01. 分享率一">上传 / 选中文件大小 的结果</a-descriptions-item>
        <a-descriptions-item label="02. 分享率二">上传 / 下载 的结果</a-descriptions-item>
        <a-descriptions-item label="03. 分享率三">上传 / 种子总大小 的结果</a-descriptions-item>
        <a-descriptions-item label="04. 站点域名">种子的 Tracker 地址的域名部分</a-descriptions-item>
        <a-descriptions-item label="05. 各类时间">选项时间到当前时间的差值, 单位为 秒/s</a-descriptions-item>
        <a-descriptions-item label="06. 各类大小">单位为 字节 / Byte, 可以使用 * 做乘法运算</a-descriptions-item>
        <a-descriptions-item label="07. 各类速度">单位为 字节/s / Byte/s</a-descriptions-item>
        <a-descriptions-item label="08. 种子状态">
          参照 qBittorrent 对种子状态的定义, 主要包含以下几类:
          <br>
          上传中: uploading, 下载中: downloading
          <br>
          等待下载: stalledDL, 做种但无上传: stalledUP
          <br>
          若想删除等待下载状态下的种子, 应填写 stalledDL
          <br>
          更多状态请参照
          <a href="https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-4.1)#get-torrent-list">qBittorrent Wiki</a>
        </a-descriptions-item>
        <a-descriptions-item label="09. 返回信息">种子 Tracker 列表中由 Tracker 返回的信息</a-descriptions-item>
        <a-descriptions-item label="10. 当前时间">
          当天 0 点到当前时间的秒数, 0 点的时间戳取决于 Vertex 安装环境的时区
          <br>
          例: 填写 当前时间大于 8*3600 与 当前时间小于 22*3600, 则只会在当天上午 8 点之后到 22 点之前删种
        </a-descriptions-item>
        <a-descriptions-item label="11. 全局速度">当前下载器的速度</a-descriptions-item>
        <a-descriptions-item label="12. 做种下载连接">仅计算已连接上的数量, 也即 qBittorrent WebUI 内括号外的数字</a-descriptions-item>
        <a-descriptions-item label="13. 做种下载任务">任务的数量, 做种包含上传中状态与做种状态, 下载包含下载中与等待下载状态</a-descriptions-item>
        <a-descriptions-item label="14. 比较类型中的 包含 / 包含于 或 不包含 / 不包含于">
          值部分需以半角逗号 , 为分割符. 如种子分类不包含于 KEEP, KEEP2, KEEP3 三个分类, 则应填写: KEEP,KEEP2,KEEP3
        </a-descriptions-item>
      </a-descriptions>
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
        width: 30
      }, {
        title: '持续时间',
        dataIndex: 'fitTime',
        width: 30
      }, {
        title: '优先级',
        dataIndex: 'priority',
        width: 10
      }, {
        title: '类型',
        dataIndex: 'type',
        width: 15
      }, {
        title: '操作',
        width: 20
      }
    ];
    const conditionColumns = [
      {
        title: '选项',
        dataIndex: 'key',
        width: 18
      }, {
        title: '比较类型',
        dataIndex: 'compareType',
        width: 18
      }, {
        title: '值',
        dataIndex: 'value',
        width: 90
      }, {
        title: '操作',
        dataIndex: 'option',
        width: 30
      }
    ];
    return {
      columns,
      conditionColumns,
      conditionKeys: [{
        name: '种子名称',
        key: 'name'
      }, {
        name: '种子进度',
        key: 'progress'
      }, {
        name: '上传速度',
        key: 'uploadSpeed'
      }, {
        name: '下载速度',
        key: 'downloadSpeed'
      }, {
        name: '种子分类',
        key: 'category'
      }, {
        name: '种子标签',
        key: 'tags'
      }, {
        name: '选择大小',
        key: 'size'
      }, {
        name: '种子大小',
        key: 'totalSize'
      }, {
        name: '种子状态',
        key: 'state'
      }, {
        name: '站点域名',
        key: 'tracker'
      }, {
        name: '返回信息',
        key: 'trackerStatus'
      }, {
        name: '已完成量',
        key: 'completed'
      }, {
        name: '已下载量',
        key: 'downloaded'
      }, {
        name: '已上传量',
        key: 'uploaded'
      }, {
        name: '分享率一',
        key: 'ratio'
      }, {
        name: '分享率二',
        key: 'trueRatio'
      }, {
        name: '分享率三',
        key: 'ratio3'
      }, {
        name: '添加时间',
        key: 'addedTime'
      }, {
        name: '完成时间',
        key: 'completedTime'
      }, {
        name: '保存路径',
        key: 'savePath'
      }, {
        name: '做种连接',
        key: 'seeder'
      }, {
        name: '下载连接',
        key: 'leecher'
      }, {
        name: '剩余空间',
        key: 'freeSpace'
      }, {
        name: '下载任务',
        key: 'leechingCount'
      }, {
        name: '做种任务',
        key: 'seedingCount'
      }, {
        name: '全局上传',
        key: 'globalUploadSpeed'
      }, {
        name: '全局下载',
        key: 'globalDownloadSpeed'
      }, {
        name: '当前时间',
        key: 'secondFromZero'
      }],
      condition: {
        key: '',
        compareType: '',
        value: ''
      },
      deleteRule: {},
      defaultDeleteRule: {
        conditions: [],
        alias: '',
        type: '',
        priority: 0,
        code: '(maindata, torrent) => {\n' +
              '  return false;\n' +
              '}'
      },
      loading: true,
      deleteRuleList: []
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
    async listDeleteRule () {
      try {
        const res = await this.$api().deleteRule.list();
        this.deleteRuleList = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modifyDeleteRule () {
      try {
        await this.$api().deleteRule.modify({ ...this.deleteRule });
        this.$message().success((this.deleteRule.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listDeleteRule(), 1000);
        this.clearDeleteRule();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      this.deleteRule = { ...row };
    },
    async deleteDeleteRule (row) {
      if (row.used) {
        this.$message().error('组件被占用, 取消占用后删除');
        return;
      }
      try {
        await this.$api().deleteRule.delete(row.id);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listDeleteRule();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    clearDeleteRule () {
      this.deleteRule = { ...this.defaultDeleteRule, conditions: [{ ...this.condition }] };
    }
  },
  async mounted () {
    this.clearDeleteRule();
    await this.listDeleteRule();
  }
};
</script>
<style scoped>
.delete-rule {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
