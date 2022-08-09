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
            <a @click="deleteDeleteRule(record)">删除</a>
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
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">新增 | 编辑</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;" @click="clearDeleteRule()">清空</a-button>
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
        name: '种子大小',
        key: 'size'
      }, {
        name: '种子状态',
        key: 'state'
      }, {
        name: '删种规则域名',
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
