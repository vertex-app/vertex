<template>
  <div style="font-size: 24px; font-weight: bold;">RSS 规则</div>
  <a-divider></a-divider>
  <div class="rss-rule">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="rssRuleList"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">RSS 规则列表</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'downloader'">
          <a-select size="small" :allowClear="true" v-model:value="record.client" style="width: 100%;" @change="modifyRssRuleDownloader(record)">
            <template v-for="downloader of downloaders" :key="downloader.id">
              <a-select-option
                :value="downloader.id">
                {{ downloader.alias }}
              </a-select-option>
            </template>
          </a-select>
        </template>
        <template v-if="column.title === '操作'">
          <span>
            <a @click="cloneClick(record)">克隆</a>
            <a-divider type="vertical" />
            <a @click="modifyClick(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
              <template #content>
                <a-button type="primary" danger @click="deleteRssRule(record)" size="small">删除</a-button>
              </template>
              <a style="color: red">删除</a>
            </a-popover>
          </span>
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑 RSS 规则</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="rssRule"
        size="small"
        @finish="modifyRssRule"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给 RSS 规则取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="rssRule.alias"/>
        </a-form-item>
        <a-form-item
          label="分类"
          name="category"
          extra="添加种子时下载器内的分类, 留空使用 RSS 任务设置的分类">
          <a-input size="small" v-model:value="rssRule.category"/>
        </a-form-item>
        <a-form-item
          label="保存路径"
          name="savePath"
          extra="添加种子时下载器内的保存路径, 留空使用 RSS 任务设置的保存路径">
          <a-input size="small" v-model:value="rssRule.savePath"/>
        </a-form-item>
        <a-form-item
          label="下载器"
          name="client"
          extra="添加种子时选择的下载器, 该选项会直接覆盖 RSS 任务的下载器选择">
          <a-select size="small" :allowClear="true" v-model:value="rssRule.client">
            <template v-for="downloader of downloaders" :key="downloader.id">
              <a-select-option
                :value="downloader.id">
                {{ downloader.alias }}
              </a-select-option>
            </template>
          </a-select>
        </a-form-item>
        <a-form-item
          label="优先级"
          name="priority"
          extra="优先级最高的规则最先匹配, 留空则按默认顺序">
          <a-input size="small" v-model:value="rssRule.priority"/>
        </a-form-item>
        <a-form-item
          label="类型"
          name="type"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="rssRule.type"  >
            <a-select-option value="normal">普通</a-select-option>
            <a-select-option value="javascript">JavaScript</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="限制条件"
          v-if="rssRule.type === 'normal'"
          name="conditions"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-table
            :style="`font-size: ${isMobile() ? '12px': '14px'};`"
            :columns="conditionColumns"
            size="small"
            :data-source="rssRule.conditions"
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
                <a style="color: red" @click="rssRule.conditions = rssRule.conditions.filter(item => item !== record)">删除</a>
              </template>
            </template>
          </a-table>
          <a-button
            type="primary"
            @click="rssRule.conditions.push({ ...condition })"
            size="small">
            新增条件
          </a-button>
        </a-form-item>
        <a-form-item
          v-if="rssRule.type === 'javascript'"
          name="code"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          label="自定义代码">
          <a-textarea  v-model:value="rssRule.code" type="textarea" :rows="10"></a-textarea >
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;" @click="clearRssRule()">清空</a-button>
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
        title: '下载器',
        dataIndex: 'downloader',
        width: 20
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
        name: '种子大小',
        key: 'size'
      }, {
        name: '种子简介',
        key: 'description'
      }],
      condition: {
        key: '',
        compareType: '',
        value: ''
      },
      rssRule: {},
      defaultRssRule: {
        conditions: [{
          key: '',
          compareType: '',
          value: ''
        }],
        alias: '',
        type: '',
        code: '(torrent) => {\n' +
              '  return false;\n' +
              '}'
      },
      loading: true,
      downloaders: [],
      rssRuleList: []
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
    async listRssRule () {
      try {
        const res = await this.$api().rssRule.list();
        this.rssRuleList = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modifyRssRuleDownloader (rssRule) {
      try {
        await this.$api().rssRule.modify({ ...rssRule });
        this.$message().success((rssRule.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listRssRule(), 1000);
        this.clearRssRule();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modifyRssRule () {
      try {
        await this.$api().rssRule.modify({ ...this.rssRule });
        this.$message().success((this.rssRule.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listRssRule(), 1000);
        this.clearRssRule();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      this.rssRule = { ...row };
    },
    cloneClick (row) {
      this.rssRule = { ...row, id: undefined };
    },
    async deleteRssRule (row) {
      if (row.used) {
        this.$message().error('组件被占用, 取消占用后删除');
        return;
      }
      try {
        await this.$api().rssRule.delete(row.id);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listRssRule();
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
    clearRssRule () {
      this.rssRule = { ...this.defaultRssRule, conditions: [{ ...this.condition }] };
    }
  },
  async mounted () {
    this.clearRssRule();
    this.listDownloader();
    await this.listRssRule();
  }
};
</script>
<style scoped>
.rss-rule {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
