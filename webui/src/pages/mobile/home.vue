<template>
  <div class="mobile-home">
    <el-card @click.native="() => $goto(item.path, $router)" v-for="(item, index) of menu" :key="index" style="margin: 20px; position: relative;">
      <div style="margin: 10px;">
        {{item.title}}
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  data () {
    return {
      menu: [
        {
          title: '下载器',
          path: '/mobile/client'
        }, {
          title: '站点数据',
          path: '/mobile/site'
        }, {
          title: '想看列表',
          path: '/mobile/wish-list'
        }
      ]
    };
  },
  methods: {
  },
  async mounted () {
  }
};
</script>

<style scoped>
</style>
