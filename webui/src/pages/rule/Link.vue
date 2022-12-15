<template>
  <div style="font-size: 24px; font-weight: bold;">链接规则</div>
  <a-divider></a-divider>
  <div class="link-rule">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="linkRules"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">链接规则列表</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'linkMode'">
          {{ record.hardlink ? '硬链接' : '软链接' }}
        </template>
        <template v-if="column.dataIndex === 'server'">
          {{ record.server ? this.serverList.filter(item => item.id === record.server)[0].alias : '本地' }}
        </template>
        <template v-if="column.title === '操作'">
          <span>
            <a @click="modifyClick(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
              <template #content>
                <a-button type="primary" danger @click="deleteLinkRule(record)" size="small">删除</a-button>
              </template>
              <a style="color: red">删除</a>
            </a-popover>
          </span>
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑链接规则</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="linkRule"
        size="small"
        @finish="modifyLinkRule"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给链接规则取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="linkRule.alias"/>
        </a-form-item>
        <a-form-item
          label="本地链接"
          name="local"
          extra="启用后本地执行链接文件, 需要将对应目录映射进 Docker"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="linkRule.local">本地链接</a-checkbox>
        </a-form-item>
        <a-form-item
          v-if="!linkRule.local"
          label="服务器"
          name="server"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select :allowClear="true" size="small" v-model:value="linkRule.server"  >
            <a-select-option v-for="server of serverList" v-model:value="server.id" :key="server.id">{{ server.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="启用硬链接"
          name="hardlink"
          extra="默认为软链接, 勾选后链接文件以硬链接方式进行"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="linkRule.hardlink">启用硬链接</a-checkbox>
        </a-form-item>
        <a-form-item
          label="链接目标目录替换"
          name="targetPath"
          extra="格式: A##B, # 为分割符"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="linkRule.targetPath"/>
        </a-form-item>
        <a-form-item
          label="生成链接文件目录"
          name="linkFilePath"
          extra="标准的目录格式, 应为影视库的顶级目录"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="linkRule.linkFilePath"/>
        </a-form-item>
        <a-form-item
          label="UMASK"
          name="umask"
          extra="用于调整生成文件的权限, 例: 0022, 如果不懂请务必留空!">
          <a-input size="small" v-model:value="linkRule.umask"/>
        </a-form-item>
        <a-form-item
          label="保留剧集名"
          name="keepSeriesName"
          extra="链接时在文件名前添加剧集的名称"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="linkRule.keepSeriesName">保留剧集名</a-checkbox>
        </a-form-item>
        <a-form-item
          label="保留制作组"
          name="group"
          extra="链接时在文件名最后保留制作组, 以文件名最后一个 - 符号为标志, 之后的内容被判定为制作组"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="linkRule.group">保留制作组</a-checkbox>
        </a-form-item>
        <a-form-item
          label="保留关键词"
          name="reservedKeys"
          extra="链接时保留关键词, 可以用 , 分割多个关键字, 在链接时将按照关键词的顺序检索文件名, 若存在则保留">
          <a-input size="small" v-model:value="linkRule.reservedKeys"/>
        </a-form-item>
        <a-form-item
          label="排除关键词"
          name="excludeKeys"
          extra="链接时排除关键词, 可以用 , 分割多个关键字, 各个关键字间为 或 的关系">
          <a-input size="small" v-model:value="linkRule.excludeKeys"/>
        </a-form-item>
        <a-form-item
          label="单文件最小体积"
          name="minFileSize"
          extra="单个文件的最小体积, 若文件体积小于本值, 将不对本文件进行链接操作, 例: 5*1024*1024 表示 5MiB"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="linkRule.minFileSize"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;" @click="clearLinkRule()">清空</a-button>
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
        width: 30
      }, {
        title: '服务器',
        dataIndex: 'server',
        width: 30
      }, {
        title: '链接模式',
        dataIndex: 'linkMode',
        width: 30
      }, {
        title: '操作',
        width: 20
      }
    ];
    return {
      columns,
      linkRule: {},
      defaultLinkRule: {
        hardlink: false,
        local: false,
        keepSeriesName: false,
        group: false
      },
      loading: true,
      serverList: [],
      linkRules: []
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
    async listLinkRule () {
      try {
        const res = await this.$api().linkRule.list();
        this.linkRules = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async listServer () {
      try {
        const res = await this.$api().server.list();
        this.serverList = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modifyLinkRule () {
      try {
        if (this.linkRule.local) {
          this.linkRule.server = '';
        }
        await this.$api().linkRule.modify({ ...this.linkRule });
        this.$message().success((this.linkRule.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listLinkRule(), 1000);
        this.clearLinkRule();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      this.linkRule = { ...row };
    },
    async deleteLinkRule (row) {
      if (row.used) {
        this.$message().error('组件被占用, 取消占用后删除');
        return;
      }
      try {
        await this.$api().linkRule.delete(row.id);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listLinkRule();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    clearLinkRule () {
      this.linkRule = { ...this.defaultLinkRule };
    }
  },
  async mounted () {
    this.clearLinkRule();
    await this.listServer();
    await this.listLinkRule();
  }
};
</script>
<style scoped>
.link-rule {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
