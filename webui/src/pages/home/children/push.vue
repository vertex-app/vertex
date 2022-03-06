<template>
  <div class="push">
    <div class="radius-div">
      <el-table
        :data="pushList"
        :default-sort="{prop: 'alias'}"
        style="margin: 20px">
        <el-table-column
          prop="id"
          label="ID"
          width="100">
        </el-table-column>
        <el-table-column
          sortable
          prop="alias"
          label="别名">
        </el-table-column>
        <el-table-column
          prop="type"
          label="推送类型">
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="200">
          <template slot-scope="scope">
            <el-button @click="modify(scope.row)" type="warning" size="small">编辑</el-button>
            <el-button @click="_delete(scope.row)" :disabled="scope.row.used" type="danger" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="radius-div">
      <el-collapse  class="collapse" v-model="Collapse">
        <el-collapse-item title="新增 | 编辑 推送工具" name="1">
          <div style="width: fit-content; margin: 6px 0 12px 20px;">
            <el-tag>ID: {{set.id}}</el-tag>
          </div>
          <el-form ref="set" class="push-form" :model="set" label-width="160px" size="mini">
            <el-form-item required label="别名" prop="alias">
              <el-input v-model="set.alias" type="input"></el-input>
            </el-form-item>
            <el-form-item label="错误推送上限" prop="maxErrorCount">
              <el-input v-model="set.maxErrorCount" type="input"></el-input>
              <div><el-tag type="info">单个周期内推送错误信息次数上限, 仅计算错误信息推送, 留空为 100</el-tag></div>
            </el-form-item>
            <el-form-item label="重置周期" prop="clearCountCron">
              <el-input v-model="set.clearCountCron" type="input"></el-input>
              <div><el-tag type="info">Crontab 表达式, 在每次触发时重置推送错误信息次数为 0, 留空为 0 * * * * </el-tag></div>
            </el-form-item>
            <el-form-item required label="类型" prop="type">
              <el-select v-model="set.type" placeholder="推送类型">
                <el-option label="IYUU" value="iyuu"></el-option>
                <el-option label="Bark" value="bark"></el-option>
                <el-option label="Telegram" value="telegram"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-if="this.set.type === 'telegram'" :required="this.set.type === 'telegram'" label="机器人 Token" prop="telegramBotToken">
              <el-input v-model="set.telegramBotToken" type="input"></el-input>
            </el-form-item>
            <el-form-item v-if="this.set.type === 'telegram'" :required="this.set.type === 'telegram'" label="频道 ID" prop="telegramChannel">
              <el-input v-model="set.telegramChannel" type="input"></el-input>
            </el-form-item>
            <el-form-item v-if="this.set.type === 'iyuu'" :required="this.set.type === 'iyuu'" label="IYUU Token" prop="iyuuToken">
              <el-input v-model="set.iyuuToken" type="input"></el-input>
            </el-form-item>
            <el-form-item v-if="this.set.type === 'bark'" :required="this.set.type === 'bark'" label="Bark Token" prop="barkToken">
              <el-input v-model="set.barkToken" type="input"></el-input>
            </el-form-item>
            <el-form-item  label="推送类型" prop="pushType">
              <el-checkbox-group v-model="set.pushType">
                <el-checkbox v-for="type of pushType" :key="type.key" :label="type.key">{{type.value}}</el-checkbox>
              </el-checkbox-group>
              <div><el-tag type="info">只有已被勾选的项目才会推送</el-tag></div>
            </el-form-item>
            <el-form-item size="small">
              <el-button type="primary" @click="handleClick">新增 | 编辑</el-button>
              <el-button @click="clearSet">清空</el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      set: {
        id: '新增',
        pushType: []
      },
      pushType: [
        {
          key: 'rssError',
          value: 'Rss 失败'
        }, {
          key: 'scrapeError',
          value: '抓取失败'
        }, {
          key: 'add',
          value: '添加种子'
        }, {
          key: 'addError',
          value: '添加种子失败'
        }, {
          key: 'reject',
          value: '拒绝种子'
        }, {
          key: 'delete',
          value: '删除种子'
        }, {
          key: 'deleteError',
          value: '删除种子失败'
        }, {
          key: 'reannounce',
          value: '重新汇报种子'
        }, {
          key: 'clientConnect',
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
          key: 'siteData',
          value: '站点数据推送'
        }, {
          key: 'mediaServer',
          value: '媒体服务器'
        }, {
          key: 'race',
          value: '追剧相关'
        }, {
          key: 'douban',
          value: '豆瓣'
        }, {
          key: 'doubanSelectError',
          value: '豆瓣选种失败'
        }, {
          key: 'finish',
          value: '种子完成'
        }
      ],
      pushList: [],
      Collapse: ['1']
    };
  },
  methods: {
    async handleClick () {
      this.$refs.set.validate(async (valid) => {
        if (valid) {
          const url = '/api/push/' + (this.set.id === '新增' ? 'add' : 'modify');
          const res = await this.$axiosPost(url, this.set);
          if (!res) {
            return;
          }
          await this.$messageBox(res);
          this.list();
          this.clearSet();
        } else {
          return false;
        }
      });
    },
    async modify (row) {
      this.set = { ...row };
    },
    async _delete (row) {
      const url = '/api/push/delete';
      const set = {
        id: row.id
      };
      const res = await this.$axiosPost(url, set);
      if (!res) {
        return;
      }
      await this.$messageBox(res);
      this.list();
    },
    async list () {
      const res = await this.$axiosGet('/api/push/list');
      this.pushList = res ? res.data : [];
    },
    clearSet () {
      this.set = {
        id: '新增',
        pushType: []
      };
    }
  },
  async mounted () {
    this.list();
  }
};
</script>

<style scoped>
.push-div {
  margin: 20px 0;
}

.collapse {
  margin: 20px;
}

.push-form * {
  width: fit-content;
  text-align: left;
}
</style>
