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
        <template v-if="column.title === '操作'">
          <span>
            <a @click="modifyClick(record)">编辑</a>
            <a-divider type="vertical" />
            <a @click="deleteRssRule(record)">删除</a>
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
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">新增 | 编辑</a-button>
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
        width: 30
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
        width: 30
      }, {
        title: '操作',
        dataIndex: 'option',
        width: 20
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
    clearRssRule () {
      this.rssRule = { ...this.defaultRssRule, conditions: [{ ...this.condition }] };
    }
  },
  async mounted () {
    this.clearRssRule();
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
