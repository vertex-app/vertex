<template>
  <div style="font-size: 24px; font-weight: bold;">订阅任务</div>
  <a-divider></a-divider>
  <div class="subscribe">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="subscribes"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">订阅任务列表</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.title === '操作'">
          <span>
            <a @click="refreshSubscribe(record)">刷新</a>
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
                  <a-menu-item danger>
                    <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
                      <template #content>
                        <a-button type="primary" danger @click="deleteSubscribe(record)" size="small">删除</a-button>
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
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑订阅任务</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="subscribe"
        size="small"
        @finish="modifySubscribe"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给订阅任务取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="subscribe.alias"/>
        </a-form-item>
        <a-form-item
          label="启用"
          name="enable"
          extra="选择是否启用订阅任务"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="subscribe.enable">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="站点"
          name="sites"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox-group style="width: 100%;" v-model:value="subscribe.sites">
            <a-row>
              <a-col v-for="site of sites" :span="8" :key="site.name">
                <a-checkbox v-model:value="site.name">{{ site.name }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          label="选择规则"
          name="raceRules"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          extra="选择选种规则, 符合这些规则的种子才会添加, 可前往选种规则分页添加, 仅显示优先级不为 0 的规则">
          <a-checkbox-group style="width: 100%;" v-model:value="subscribe.raceRules">
            <a-row>
              <template v-for="selectRule of selectRules" :key="selectRule.id">
                <a-col v-if="selectRule.priority !== '0'" :span="8">
                  <a-checkbox  v-model:value="selectRule.id">{{ selectRule.alias }}</a-checkbox>
                </a-col>
              </template>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          label="排除规则"
          name="rejectRules"
          extra="选择排除规则, 符合这些规则的种子都会被拒绝, 可前往选种规则分页添加, 仅显示优先级为 0 的规则">
          <a-checkbox-group style="width: 100%;" v-model:value="subscribe.rejectRules">
            <a-row>
              <template v-for="selectRule of selectRules" :key="selectRule.id">
                <a-col v-if="selectRule.priority === '0'" :span="8">
                  <a-checkbox  v-model:value="selectRule.id">{{ selectRule.alias }}</a-checkbox>
                </a-col>
              </template>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          label="链接规则"
          name="linkRule"
          extra="链接规则, 留空则不启用自动链接">
          <a-select size="small" v-model:value="subscribe.linkRule">
            <a-select-option v-for="linkRule of linkRules" v-model:value="linkRule.id" :key="linkRule.id">{{ linkRule.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="下载器"
          name="client"
          extra="选择下载器, 仅可选择已经启用的下载器">
          <a-select size="small" v-model:value="subscribe.client">
            <a-select-option v-for="downloader of downloaders" v-model:value="downloader.id" :key="downloader.id">{{ downloader.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="分类"
          name="categories"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-form-item-rest>
            <a-table
              :style="`font-size: ${isMobile() ? '12px': '14px'};`"
              :columns="categoriesColumns"
              size="small"
              :data-source="subscribe.categories"
              :pagination="false"
              :scroll="{ x: 980 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'doubanTag'">
                  <a-input size="small" v-model:value="record.doubanTag"/>
                </template>
                <template v-if="column.dataIndex === 'type'">
                  <a-select size="small" v-model:value="record.type">
                    <a-select-option value="movie">电影</a-select-option>
                    <a-select-option value="series">剧集</a-select-option>
                  </a-select>
                </template>
                <template v-if="column.dataIndex === 'category'">
                  <a-input size="small" v-model:value="record.category"/>
                </template>
                <template v-if="column.dataIndex === 'libraryPath'">
                  <a-input size="small" v-model:value="record.libraryPath"/>
                </template>
                <template v-if="column.dataIndex === 'savePath'">
                  <a-input size="small" v-model:value="record.savePath"/>
                </template>
                <template v-if="column.dataIndex === 'autoTMM'">
                  <a-checkbox v-model:checked="record.autoTMM">自动管理</a-checkbox>
                </template>
                <template v-if="column.dataIndex === 'autoSearch'">
                  <a-checkbox v-model:checked="record.autoSearch">添加自动刷新</a-checkbox>
                </template>
                <template v-if="column.dataIndex === 'rejectKeys'">
                  <a-input size="small" v-model:value="record.rejectKeys"/>
                </template>
                <template v-if="column.dataIndex === 'rules'">
                  <a-button type="primary" @click="expandModal(record)" size="small">弹出</a-button>
                </template>
                <template v-if="column.dataIndex === 'option'">
                  <a style="color: red" @click="subscribe.categories = subscribe.categories.filter(item => item !== record)">删除</a>
                </template>
              </template>
            </a-table>
            <a-button
              type="primary" @click="subscribe.categories.push({ ...defaultCategory })"
              size="small"
            >新增条件</a-button>
          </a-form-item-rest>
        </a-form-item>
        <a-form-item
          label="Cookie"
          name="cookie"
          extra="登录豆瓣账户后获取到的 Cookie"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="subscribe.cookie"/>
        </a-form-item>
        <a-form-item
          label="附加账号"
          name="users"
          extra="监视 cookie 自有账号时添加其它人账号 ID, 格式为 'ID1,ID2,ID3', 留空不启用">
          <a-input size="small" v-model:value="subscribe.users"/>
        </a-form-item>
        <a-form-item
          label="刷新周期"
          name="cron"
          extra="刷新 想看列表 的周期, 默认为每 4 小时刷新一次, 仅刷新想看列表"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="subscribe.cron"/>
        </a-form-item>
        <a-form-item
          label="超级模式"
          name="advancedMode"
          extra="超级模式, 除了定期搜索站内种子外, 每十分钟向 Vertex Panel 搜索种子"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="subscribe.advancedMode">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="接收微信消息"
          name="enableWechatLink"
          extra="接收微信消息, 需要在全局设置内设置对应的微信 Token 以及 AesKey">
          <a-checkbox v-model:checked="subscribe.enableWechatLink">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="推送通知"
          name="push"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="subscribe.push">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          v-if="subscribe.push"
          label="通知方式"
          name="notify"
          extra="通知方式, 用于推送删种等信息, 在通知工具页面创建"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="subscribe.notify">
            <a-select-option v-for="notification of notifications" v-model:value="notification.id" :key="notification.id">{{ notification.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;"  @click="clearSubscribe()">清空</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
  <a-modal
    v-model:visible="modalVisible"
    title="推送种子"
    width="1440px"
    :footer="null">
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="expandCategory"
        size="small"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off">
        <a-form-item
          :wrapperCol="{ span:24 }">
          <span>
            {{ expandCategory.doubanTag }}
          </span>
        </a-form-item>
        <a-form-item
          label="选择规则"
          name="raceRules"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          extra="选择选种规则, 符合这些规则的种子才会添加, 可前往选种规则分页添加, 仅显示优先级不为 0 的规则">
          <a-checkbox-group style="width: 100%;" v-model:value="expandCategory.raceRules">
            <a-row>
              <template v-for="selectRule of selectRules" :key="selectRule.id">
                <a-col v-if="selectRule.priority !== '0'" :span="8">
                  <a-checkbox  v-model:value="selectRule.id">{{ selectRule.alias }}</a-checkbox>
                </a-col>
              </template>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          label="排除规则"
          name="rejectRules"
          extra="选择排除规则, 符合这些规则的种子都会被拒绝, 可前往选种规则分页添加, 仅显示优先级为 0 的规则">
          <a-checkbox-group style="width: 100%;" v-model:value="expandCategory.rejectRules">
            <a-row>
              <template v-for="selectRule of selectRules" :key="selectRule.id">
                <a-col v-if="selectRule.priority === '0'" :span="8">
                  <a-checkbox  v-model:value="selectRule.id">{{ selectRule.alias }}</a-checkbox>
                </a-col>
              </template>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          label="默认集数"
          name="defaultEpisodes"
          extra="若豆瓣词条无集数信息，则按照默认集数处理, 仅支持剧集类型">
          <a-input size="small" v-model:value="expandCategory.defaultEpisodes"/>
        </a-form-item>
        <a-form-item
          label="默认取消年份限制"
          name="defaultrestrictYear"
          extra="默认限制年份, 勾选后取消限制">
          <a-checkbox v-model:checked="expandCategory.defaultrestrictYear">取消限制年份</a-checkbox>
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
        width: 5,
        fixed: true
      }, {
        title: '别名',
        dataIndex: 'alias',
        width: 20
      }, {
        title: '操作',
        width: 5
      }
    ];
    const categoriesColumns = [
      {
        title: '豆瓣标签',
        dataIndex: 'doubanTag',
        width: 24,
        fixed: true
      }, {
        title: '所属分类',
        dataIndex: 'type',
        width: 20
      }, {
        title: '下载器分类',
        dataIndex: 'category',
        width: 20
      }, {
        title: '资料库文件夹',
        dataIndex: 'libraryPath',
        width: 20
      }, {
        title: '保存路径',
        dataIndex: 'savePath',
        width: 20
      }, {
        title: '自动管理',
        dataIndex: 'autoTMM',
        width: 20
      }, {
        title: '添加自动刷新',
        dataIndex: 'autoSearch',
        width: 26
      }, {
        title: '排除关键词',
        dataIndex: 'rejectKeys',
        width: 20
      }, {
        title: '规则',
        dataIndex: 'rules',
        width: 16
      }, {
        title: '操作',
        dataIndex: 'option',
        width: 12
      }
    ];
    return {
      columns,
      categoriesColumns,
      modalVisible: false,
      subscribes: [],
      notifications: [],
      selectRules: [],
      downloaders: [],
      subscribe: {},
      sites: [],
      linkRules: [],
      expandCategory: {
        raceRules: [],
        rejectRules: []
      },
      defaultSubscribe: {
        cron: '0 */4 * * *',
        sites: [],
        push: true,
        raceRules: [],
        rejectRules: [],
        categories: []
      },
      defaultCategory: {
        doubanTag: '',
        type: '',
        category: '',
        libraryPath: '',
        savePath: '',
        autoTMM: false,
        rejectKeys: '',
        categoryRules: [],
        autoSearch: true
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
    async listSubscribe () {
      try {
        const res = await this.$api().subscribe.list();
        this.subscribes = res.data;
        for (const s of this.subscribes) {
          for (const c of s.categories) {
            if (!c.raceRules) {
              c.raceRules = [];
            }
            if (!c.rejectRules) {
              c.rejectRules = [];
            }
          }
        }
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
    async listSelectRule () {
      try {
        const res = await this.$api().selectRule.list();
        this.selectRules = res.data.sort((a, b) => b.priority - a.priority || a.alias.localeCompare(b.alias));
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async listSite () {
      try {
        const res = await this.$api().site.list();
        this.sites = res.data.siteList;
      } catch (e) {
        this.$message().error(e.message);
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
    async listDownloader () {
      try {
        const res = await this.$api().downloader.list();
        this.downloaders = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modifySubscribe () {
      try {
        await this.$api().subscribe.modify({ ...this.subscribe });
        this.$message().success((this.subscribe.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listSubscribe(), 1000);
        this.clearSubscribe();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      this.subscribe = { ...row };
    },
    cloneClick (row) {
      /*
        sites: [],
        raceRules: [],
        rejectRules: [],
        categories: [{ ...this.defaultCategory }]
      */
      this.subscribe = {
        ...row,
        sites: [...row.sites],
        raceRules: [...row.raceRules],
        rejectRules: [...row.rejectRules],
        categories: [...row.categories.map(item => ({
          ...item,
          raceRules: [...item.raceRules],
          rejectRules: [...item.rejectRules]
        }))]
      };
      this.subscribe.id = null;
      this.subscribe.alias = this.subscribe.alias + '-克隆';
    },
    expandModal (row) {
      this.modalVisible = true;
      this.expandCategory = row;
    },
    async deleteSubscribe (row) {
      try {
        await this.$api().subscribe.delete(row.id);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listSubscribe();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async refreshSubscribe (row) {
      try {
        await this.$api().subscribe.refreshSubscribe(row.id);
        this.$message().success('已启动刷新任务');
        await this.listSubscribe();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    clearSubscribe () {
      this.subscribe = {
        ...this.defaultSubscribe,
        sites: [],
        raceRules: [],
        rejectRules: [],
        categories: [{ ...this.defaultCategory }]
      };
    }
  },
  async mounted () {
    this.clearSubscribe();
    this.listSelectRule();
    this.listSite();
    this.listLinkRule();
    this.listDownloader();
    this.listNotification();
    this.listSubscribe();
  }
};
</script>
<style scoped>
.subscribe {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
