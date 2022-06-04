<template>
  <div id="app">
    <div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {
  },
  data () {
    return {
    };
  },
  methods: {
    async getBackground () {
      const res = await this.$axiosGet('/api/setting/getBackground');
      document.body.style.background = res.data ? `url(${res.data})` : 'url(\'/assets/images/background.jpg\')';
      document.body.style.backgroundPositionX = 'center';
      document.body.style.backgroundPositionY = 'center';
      document.body.style.backgroundSize = 'cover';
    },
    setViewport () {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width,initial-scale=1.0';
      document.head.appendChild(viewport);
    }
  },
  created () {
    if (this.$route.path.indexOf('mobile') === -1) {
      // this.getBackground();
    } else {
      this.setViewport();
    }
  }
};
</script>

<style>
@import '/api/setting/getBackground.css';
@import '/api/setting/getCss.css';

@font-face{
  font-family: 'consolas';
  src: url('/assets/fonts/consolas.woff');
}

#app, #app * {
  font-family: consolas, "LXGW WenKai Screen", "Microsoft YaHei","微软雅黑","Hiragino Sans GB","Helvetica Neue",Helvetica,"PingFang SC",Arial,sans-serif;
  /*font-family: Dosis,Open Sans,pingfang SC,-apple-system,Helvetica Neue,Helvetica,Arial,PingFang SC,PingFang TC,Hiragino Sans GB,Microsoft Yahei,Microsoft Jhenghei,sans-serif;
  */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

.el-tabs--card>.el-tabs__header {
  border-bottom: none;
  margin: 0 2px;
}

.el-tabs__item {
  color: #fff;
  border-radius: 8px !important;
}

/*
.el-tabs, .radius-div {
  border-radius: 8px;
  background: rgba(255,255,255, 0.3);
  backdrop-filter: blur(4px);
}
*/
.el-table__body td.el-table__cell .el-row:hover{
    background-color: rgba(255,255,255, 0.1) !important;
    backdrop-filter: blur(4px);
    border-radius: 8px;
}

.el-table__body td.el-table__cell .el-row {
  padding: 0 10px;
}

tr.hover-row>td.el-table__cell {
  background-color: transparent !important;
}

.el-dialog {
  background: rgba(255,255,255, 0.4);
  backdrop-filter: blur(16px);
  width: 960px;
  border-radius: 8px;
}

.el-table__body .el-table__row:hover, .el-table--enable-row-hover .el-table__body tr:hover>td.el-table__cell {
  background-color: transparent !important;
}

.el-table__body td.el-table__cell .cell:hover{
  background-color: transparent !important;
}

.el-textarea__inner {
  font-family: consolas, "LXGW WenKai Screen";
}

.el-card, .el-descriptions, .el-link.el-link--default, .el-dialog__body {
  color: #fff
}

.el-table {
  width: auto;
  color: #fff
}

.el-table thead, .el-form-item__label, .el-checkbox__label, .el-table__empty-text, .el-collapse-item__header {
  color: #fff
}

.el-tabs--card>.el-tabs__header .el-tabs__item.is-active {
  border-bottom: none;
}

.el-tabs--card>.el-tabs__header .el-tabs__item {
  border-left: none;
}

.el-card {
  border: none;
  background-color: transparent;
}

.el-table__expand-icon {
  width: 72px;
  height: 48px;
  padding-left: 0;
  padding-right: 0;
 }

.el-table__expand-column .cell {
  width: 72px;
  height: 48px;
  padding-left: 0;
  padding-right: 0;
}

.el-tabs--card>.el-tabs__header .el-tabs__nav {
  border: none;
}

.el-menu-item {
  color: #fff;
}

.el-descriptions__body {
  color: #fff;
}

.el-descriptions-item__label.is-bordered-label {
  background: transparent !important;
}

.el-descriptions__body, .el-table, .el-table tr,
.el-table__expanded-cell, .el-table th.el-table__cell,
.el-divider--horizontal, .el-table--border::after,
.el-table--group::after, .el-table::before, .el-table__fixed-right::before,
.el-table__fixed::before, .el-collapse-item__header, .el-collapse-item__wrap,
.el-input__inner, .el-checkbox__inner, .el-textarea__inner, .el-input-group__append, .el-input-group__prepend, .el-tag.el-tag--info {
  background-color: transparent !important;
}

.el-input__inner, .el-checkbox__inner, .el-textarea__inner,
.el-input-group__append, .el-input-group__prepend {
  border: 1px solid #409EFF;
  color: #fff;
  font-family: consolas, "LXGW WenKai Screen";
}

.el-checkbox__inner::after {
  border-left: 0;
  border-top: 0;
}

img[lazy=loading] {
  background-size: cover;
  background-position-x: center;
  background-position-y: center;
}

.el-select-dropdown__item {
  font-family: consolas, "LXGW WenKai Screen";
}

.el-tag.el-tag--info {
  color: #fff;
}
.el-input__inner::placeholder {
  color: #409EFF;
}
.el-tag {
  border: none;
}

.el-collapse {
  border-top: none;
  border-bottom: none;
}

.el-table td.el-table__cell, .el-table th.el-table__cell.is-leaf, .el-collapse-item__wrap, .el-collapse-item__header {
  border-bottom: none;
}

.mobile-client .el-card__body, .mobile-site .el-card__body {
  padding: 0;
}

*::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background-color: #00BFFF;
}

*::-webkit-scrollbar {
  width : 4px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: #ededed;
  border-radius: 10px;
}
</style>
