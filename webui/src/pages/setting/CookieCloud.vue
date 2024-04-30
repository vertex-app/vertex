<template>
  <div style="font-size: 24px; font-weight: bold;">CookieCloud</div>
  <a-divider></a-divider>
  <div class="style-setting" >
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="setting"
        size="small"
        @finish="modify"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="启用同步"
          name="cookiecloud.enable">
          <a-checkbox v-model:checked="setting.cookiecloud.enable">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="同步周期"
          name="cookiecloud.cron"
          extra="同步周期 cron 表达式，默认为每小时一次">
          <a-input size="small" v-model:value="setting.cookiecloud.cron"/>
        </a-form-item>
        <a-form-item
          label="Host"
          name="cookiecloud.host"
          extra="cookie cloud 的 host, 格式: http://192.168.1.1:8088">
          <a-input size="small" v-model:value="setting.cookiecloud.host"/>
        </a-form-item>
        <a-form-item
          label="uuid"
          name="cookiecloud.uuid">
          <a-input size="small" v-model:value="setting.cookiecloud.uuid"/>
        </a-form-item>
        <a-form-item
          label="password"
          name="cookiecloud.passwd">
          <a-input size="small" v-model:value="setting.cookiecloud.passwd"/>
        </a-form-item>
        <a-form-item
          label="启用站点"
          name="cookiecloud.sites"
          extra="选择同步 cookie 的站点, 站点对应域名看这里: https://github.com/vertex-app/vertex/tree/stable/app/libs/site">
          <a-checkbox-group style="width: 100%;" v-model:value="setting.cookiecloud.sites">
            <a-row>
              <a-col v-for="s of sites" :span="8" :key="s.text">
                <a-checkbox v-model:value="s.text">{{ s.text }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item
          label="同步豆瓣 Cookie"
          name="cookiecloud.douban">
          <a-checkbox v-model:checked="setting.cookiecloud.douban">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">保存</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      setting: {
        cookiecloud: {
          sites: []
        }
      },
      sites: []
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
    async listSite () {
      try {
        const res = await this.$api().site.listSite({ search: 1 });
        this.sites = res.data.map(item => ({ text: item, name: item }));
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async get () {
      try {
        const s = (await this.$api().setting.get()).data;
        this.setting = {
          cookiecloud: s.cookiecloud || {
            sites: [],
            enable: false,
            douban: false,
            cron: '3 * * * *',
            passwd: '',
            uuid: '',
            host: ''
          }
        };
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async modify () {
      try {
        await this.$api().setting.modify(this.setting);
        await this.$message().success('修改成功, 部分设置可能需要刷新页面生效.');
        this.get();
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    this.listSite();
    await this.get();
  }
};
</script>
<style scoped>
.style-setting {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: center;
}
</style>
