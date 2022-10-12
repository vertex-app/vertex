<template>
  <div style="font-size: 24px; font-weight: bold;">订阅详情</div>
  <a-divider></a-divider>
  <div class="subscribe-detail" >
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="item"
        size="small"
        @finish="editItem"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="操作">
          <a-button type="primary" @click="refreshItem()">刷新</a-button>
          <a-button type="primary" danger style="margin-left: 12px;" @click="deleteItem()">删除</a-button>
          <a-button style="margin-left: 12px;" @click="$goto('/subscribe/list', $router);">返回</a-button>
        </a-form-item>
        <a-divider></a-divider>
        <a-form-item
          label="影视剧名"
          name="name"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="item.name"/>
        </a-form-item>
        <a-form-item
          label="标签"
          name="tag"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="item.tag"/>
        </a-form-item>
        <a-form-item
          label="年份"
          name="year"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="item.year"/>
        </a-form-item>
        <a-form-item
          label="上映日期"
          name="releaseAt"
          extra="格式为 2022-06-03">
          <a-input size="small" v-model:value="item.releaseAt"/>
        </a-form-item>
        <a-form-item
          label="总集数"
          name="episodes">
          <a-input size="small" v-model:value="item.episodes"/>
        </a-form-item>
        <a-form-item
          label="当前集"
          name="episodeNow">
          <a-input size="small" v-model:value="item.episodeNow"/>
        </a-form-item>
        <a-form-item
          label="已完成"
          name="downloaded"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="item.downloaded">已完成</a-checkbox>
        </a-form-item>
        <a-form-item
          label="搜索使用的关键词"
          name="searchKey"
          extra="搜索种子时使用的关键词, 留空不启用">
          <a-input size="small" v-model:value="item.searchKey"/>
        </a-form-item>
        <a-form-item
          label="包含关键词"
          name="acceptKeys"
          extra="以 , 为分割, 各个关键词间为 且 的关系">
          <a-input size="small" v-model:value="item.acceptKeys"/>
        </a-form-item>
        <a-form-item
          label="排除关键词"
          name="rejectKeys"
          extra="以 , 为分割, 各个关键词间为 或 的关系">
          <a-input size="small" v-model:value="item.rejectKeys"/>
        </a-form-item>
        <a-form-item
          label="过滤关键词"
          name="removeKeyword"
          extra="识别集数时用于去除副标题内的特定关键词, 正则表达式, 例: 总第\d+集 表示去除掉 总第60集这类表达">
          <a-input size="small" v-model:value="item.removeKeyword"/>
        </a-form-item>
        <a-form-item
          label="固定季"
          name="fixedSeason"
          extra="适用于特别篇等内容, 设置固定季后按照设置项软链接, 如 特别篇, 此处填 0">
          <a-input size="small" v-model:value="item.fixedSeason"/>
        </a-form-item>
        <a-form-item
          label="自动链接集数偏移"
          name="episodeOffset"
          extra="自动链接时在识别集数的基础上做加减运算, 允许 -2, -1, 1, 2 等数值, 正值为加, 负值为减">
          <a-input size="small" v-model:value="item.episodeOffset"/>
        </a-form-item>
        <a-form-item
          label="取消限制年份"
          name="restrictYear"
          extra="默认限制年份, 勾选后取消限制">
          <a-checkbox v-model:checked="item.restrictYear">取消限制年份</a-checkbox>
        </a-form-item>
        <a-form-item
          label="禁止下载全集"
          name="rejectCompleteTorrent"
          extra="如果当前集不为零, 且勾选禁止下载全集, 则在选择种子时排除全集种子">
          <a-checkbox v-model:checked="item.rejectCompleteTorrent">禁止下载全集</a-checkbox>
        </a-form-item>
        <a-form-item
          label="忽略集数识别"
          name="ignoreEpisodes"
          extra="当种子未识别到集数时, 直接认为本种是全集">
          <a-checkbox v-model:checked="item.ignoreEpisodes">忽略集数识别</a-checkbox>
        </a-form-item>
        <a-form-item
          label="取消链接"
          name="cancelLink"
          extra="当勾选取消链接时, 该项目在种子完成后不会执行链接操作">
          <a-checkbox v-model:checked="item.cancelLink">取消链接</a-checkbox>
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
      item: {}
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
    async getItem () {
      try {
        this.item = (await this.$api().subscribe.getItem(this.$route.params.id, this.$route.params.douban)).data;
        this.item.downloaded = this.item.downloaded || false;
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async refreshItem () {
      try {
        await this.$api().subscribe.refreshItem(this.$route.params.id, this.$route.params.douban);
        await this.$message().success('刷新成功!');
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async deleteItem () {
      try {
        await this.$api().subscribe.deleteItem(this.$route.params.id, this.$route.params.douban);
        await this.$message().success('删除成功!');
        this.$goto('/subscribe/list', this.$router);
      } catch (e) {
        await this.$message().error(e.message);
      }
    },
    async editItem () {
      try {
        await this.$api().subscribe.editItem(this.item);
        await this.$message().success('编辑成功!');
        this.$goto('/subscribe/list', this.$router);
      } catch (e) {
        await this.$message().error(e.message);
      }
    }
  },
  async mounted () {
    await this.getItem();
  }
};
</script>
<style scoped>
.subscribe-detail {
  height: calc(100% - 92px);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: center;
}

</style>
