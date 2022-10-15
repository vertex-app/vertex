<template>
  <div style="font-size: 24px; font-weight: bold;">菜单设置</div>
  <a-divider></a-divider>
  <div class="menu-setting" >
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
          label="选中页面"
          name="selectPage">
          <a-tree
            v-model:selectedKeys="menuSelected"
            v-model:expandedKeys="menuExpanded"
            v-model:checkedKeys="menuChecked"
            size="small"
            checkable
            :checkStrictly="true"
            :autoExpandParent="true"
            :tree-data="treeData"
            >
          </a-tree>
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
      setting: {},
      treeData: [],
      allKeys: [],
      menuSelected: [],
      menuExpanded: [],
      menuChecked: []
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
    async get () {
      try {
        const res = await this.$api().user.get();
        const menu = res.data.menu;
        // this.treeData = [];
        for (const item of menu) {
          const node = {
            title: item.title,
            key: item.path
          };
          if (item.sub) {
            node.children = [];
            for (const subItem of item.sub) {
              node.children.push({
                title: subItem.title,
                key: subItem.path
              });
            }
          }
          this.treeData.push(node);
        }
        for (const item of menu) {
          this.menuExpanded.push(item.path);
          this.allKeys.push(item.path);
          if (!item.hidden) {
            this.menuChecked.push(item.path);
          }
          if (item.sub) {
            for (const subItem of item.sub) {
              this.allKeys.push(subItem.path);
              if (!subItem.hidden) {
                this.menuChecked.push(subItem.path);
              }
            }
          }
        }
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async modify () {
      try {
        this.setting.menu = this.allKeys.filter(item => this.menuChecked.checked.indexOf(item) === -1);
        await this.$api().setting.modify(this.setting);
        await this.$message().success('修改成功, 部分设置可能需要刷新页面生效.');
        this.get();
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    await this.get();
  }
};
</script>
<style scoped>
.menu-setting {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: center;
}
</style>
