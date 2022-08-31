<template>
  <div style="font-size: 24px; font-weight: bold;">选种规则</div>
  <a-divider></a-divider>
  <div class="select-rule">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="selectRuleList"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">选种规则列表</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'sortType'">
          {{ (conditionKeys.filter(item => item.key === record.sortBy)[0] || {}).name }}
          {{ record.sortType ? record.sortType === 'asc' ? '/ 升序' : '/ 降序' : '' }}
        </template>
        <template v-if="column.title === '操作'">
          <span>
            <a @click="modifyClick(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
              <template #content>
                <a-button type="primary" danger @click="deleteSelectRule(record)" size="small">删除</a-button>
              </template>
              <a style="color: red">删除</a>
            </a-popover>
          </span>
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑选种规则</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="selectRule"
        size="small"
        @finish="modifySelectRule"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给选种规则取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="selectRule.alias"/>
        </a-form-item>
        <a-form-item
          label="优先级"
          name="priority"
          extra="优先级越高的规则越先执行, 默认为 0"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="selectRule.priority"/>
        </a-form-item>
        <a-form-item
          label="排序规则"
          name="sortBy"
          extra="在使用本规则匹配之前, 按照所选排序规则对种子进行排序, 排序指标默认为种子发布时间, 降序">
          <a-select size="small" v-model:value="selectRule.sortBy"  >
            <a-select-option v-for="conditionKey of conditionKeys" :key="conditionKey.key" :value="conditionKey.key">{{ conditionKey.name }}</a-select-option>
          </a-select>
          <a-form-item-rest>
            <a-select size="small" v-model:value="selectRule.sortType"  >
              <a-select-option v-for="item of [{name: '升序', key: 'asc'}, {name: '降序', key: 'desc'}]" :key="item.key" :value="item.key">{{ item.name }}</a-select-option>
            </a-select>
          </a-form-item-rest>
        </a-form-item>
        <a-form-item
          label="类型"
          name="type"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="selectRule.type"  >
            <a-select-option value="normal">普通</a-select-option>
            <a-select-option value="javascript">JavaScript</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="限制条件"
          v-if="selectRule.type === 'normal'"
          name="conditions"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-form-item-rest>
            <a-table
              :style="`font-size: ${isMobile() ? '12px': '14px'};`"
              :columns="conditionColumns"
              size="small"
              :data-source="selectRule.conditions"
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
                  <a style="color: red" @click="selectRule.conditions = selectRule.conditions.filter(item => item !== record)">删除</a>
                </template>
              </template>
            </a-table>
            <a-button
              type="primary"
              @click="selectRule.conditions.push({ ...condition })"
              size="small">
              新增条件
            </a-button>
          </a-form-item-rest>
        </a-form-item>
        <a-form-item
          v-if="selectRule.type === 'javascript'"
          name="code"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          label="自定义代码">
          <a-textarea  v-model:value="selectRule.code" type="textarea" :rows="10"></a-textarea >
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;">清空</a-button>
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
        fixed: true
      }, {
        title: '别名',
        dataIndex: 'alias',
        sorter: {
          compare: (a, b) => a.alias.localeCompare(b.alias),
          multiple: 1
        },
        width: 30
      }, {
        title: '优先级',
        dataIndex: 'priority',
        width: 20,
        sorter: {
          compare: (a, b) => +a.priority - +b.priority,
          multiple: 2
        },
        defaultSortOrder: 'descend'
      }, {
        title: '排序规则',
        dataIndex: 'sortType',
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
        name: '站点',
        key: 'sitePriority'
      }, {
        name: '标题',
        key: 'title'
      }, {
        name: '副标题',
        key: 'subtitle'
      }, {
        name: '种子大小',
        key: 'size'
      }, {
        name: '影视语言',
        key: 'language'
      }, {
        name: '影视地区',
        key: 'area'
      }, {
        name: '资源分类',
        key: 'category'
      }, {
        name: '做种人数',
        key: 'seeders'
      }, {
        name: '下载人数',
        key: 'leechers'
      }, {
        name: '完成次数',
        key: 'snatches'
      }, {
        name: '发布时间',
        key: 'time'
      }, {
        name: '种子标签',
        key: 'tags'
      }],
      condition: {
        key: '',
        compareType: '',
        value: ''
      },
      selectRule: {},
      defaultSelectRule: {
        conditions: [{
          key: '',
          compareType: '',
          value: ''
        }],
        code: '(torrent) => {\n' +
              '  return false;\n' +
              '}'
      },
      loading: true,
      selectRuleList: []
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
    async listSelectRule () {
      try {
        const res = await this.$api().selectRule.list();
        this.selectRuleList = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modifySelectRule () {
      try {
        await this.$api().selectRule.modify({ ...this.selectRule });
        this.$message().success((this.selectRule.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listSelectRule(), 1000);
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      this.selectRule = { ...row };
    },
    async deleteSelectRule (row) {
      if (row.used) {
        this.$message().error('组件被占用, 取消占用后删除');
        return;
      }
      try {
        await this.$api().selectRule.delete(row.id);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listSelectRule();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    clearSelectRule () {
      this.selectRule = { ...this.SelectRule, conditions: [{ ...this.condition }] };
    }
  },
  async mounted () {
    this.clearSelectRule();
    await this.listSelectRule();
  }
};
</script>
<style scoped>
.select-rule {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
