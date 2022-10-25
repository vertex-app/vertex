<template>
  <div style="font-size: 24px; font-weight: bold;">链接文件</div>
  <a-divider></a-divider>
  <div class="link">
    <div style="text-align: left; ">
      <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">链接文件</div>
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="linkInfo"
        size="small"
        @finish="link('dryrun')"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="下载器">
          <span>{{ this.torrentInfo.clientAlias }}</span>
        </a-form-item>
        <a-form-item
          label="种子标题">
          <span>{{ this.torrentInfo.name }}</span>
        </a-form-item>
        <a-form-item
          label="种子大小">
          <span>{{ $formatSize(this.torrentInfo.size) }}</span>
        </a-form-item>
        <a-form-item
          label="保存路径">
          <span>{{ this.torrentInfo.savePath }}</span>
        </a-form-item>
        <a-form-item
          label="种子 HASH">
          <span>{{this.torrentInfo.hash}}</span>
        </a-form-item>
        <a-form-item
          label="链接规则"
          name="linkRule"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="linkInfo.linkRule">
            <a-select-option v-for="linkRule of linkRules" v-model:value="linkRule.id" :key="linkRule.id">{{ linkRule.alias }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="类型"
          name="type"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small" v-model:value="linkInfo.type">
            <a-select-option value="movie">电影</a-select-option>
            <a-select-option value="series">剧集</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="资料库文件夹"
          name="libraryPath"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-select size="small"
            :options="libraryPaths"
            @search="(value) => libraryPaths[0].value = value"
            :showSearch="true"
            v-model:value="linkInfo.libraryPath">
          </a-select>
        </a-form-item>
        <a-form-item
          label="链接模式"
          name="linkMode"
          :rules="[{ required: true, message: '${label}不可为空! ' }]"
          extra="链接模式, 正常模式需要先 检查 之后 执行!">
          <a-select size="small" v-model:value="linkInfo.linkMode">
            <a-select-option value="normal">正常模式</a-select-option>
            <a-select-option value="keepStruct-1">保留目录结构并添加顶层文件夹</a-select-option>
            <a-select-option value="keepStruct-2">保留目录结构并替换顶层文件夹</a-select-option>
            <a-select-option value="keepStruct-3">保留目录结构并不修改顶层文件夹</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="影视剧名"
          name="mediaName"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="linkInfo.mediaName"/>
        </a-form-item>
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">检查</a-button>
          <a-button type="primary" danger style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;"  @click="link">执行</a-button>
        </a-form-item>
      </a-form>
      <a-divider></a-divider>
      <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">选择文件</div>
      <a-form
        labelAlign="right"
        :labelWrap="true"
        size="small"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-select size="small" v-model:value="selectFile" style="width: calc(100% - 80px);">
            <a-select-option :disabled="file.episode !== -999" v-for="file of fileList" v-model:value="file.file" :key="file.file">{{ file.file }}</a-select-option>
          </a-select>
          <a-button
            size="small"
            @click="() => { fileList.filter(item => item.file === selectFile)[0].episode = 0; selectFile = '' }"
            type="primary"
            style="width: 64px; margin-left: 16px;">
            增加
          </a-button>
        </a-form-item>
      </a-form>
      <a-divider></a-divider>
      <a-table
        :style="`font-size: ${isMobile() ? '12px': '14px'};`"
        :columns="linkInfo.type === 'series' ? seriesColumns : movieColumns"
        size="small"
        :data-source="fileList.filter(item => item.episode !== -999)"
        :pagination="false"
        :scroll="{ x: linkInfo.type === 'series' ? 1200 : 640 }"
      >
        <template #title>
          <span style="font-size: 16px; font-weight: bold;">链接文件列表</span>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'seriesName'">
            <a-input-group compact>
              <a-input size="small" @change="() => refreshSeriesName()" v-model:value="record.seriesName" style="width: calc(100% - 20px)"/>
              <fa
                @click="() => { record.seriesNameUnlink = !record.seriesNameUnlink; }"
                :icon="['fas', record.seriesNameUnlink ? 'unlink' : 'link']"
                :style="{ width: '16px', height: '24px', 'margin-left': '4px', color: record.seriesNameUnlink ? 'red' : 'blue', cursor: 'pointer' }">
              </fa>
            </a-input-group>
          </template>
          <template v-if="column.dataIndex === 'season'">
            <a-input-group compact>
              <a-input size="small" @change="() => refreshSeason()" v-model:value="record.season" style="width: calc(100% - 20px)"/>
              <fa
                @click="() => { record.seasonUnlink = !record.seasonUnlink; }"
                :icon="['fas', record.seasonUnlink ? 'unlink' : 'link']"
                :style="{ width: '16px', height: '24px', 'margin-left': '4px', color: record.seasonUnlink ? 'red' : 'blue', cursor: 'pointer' }">
              </fa>
            </a-input-group>
          </template>
          <template v-if="column.dataIndex === 'episode'">
            <a-input-group compact>
              <a-input size="small" @change="() => refreshEpisode()" v-model:value="record.episode" style="width: calc(100% - 20px)"/>
              <fa
                @click="() => { record.episodeUnlink = !record.episodeUnlink; }"
                :icon="['fas', record.episodeUnlink ? 'unlink' : 'link']"
                :style="{ width: '16px', height: '24px', 'margin-left': '4px', color: record.episodeUnlink ? 'red' : 'blue', cursor: 'pointer' }">
              </fa>
            </a-input-group>
          </template>
          <template v-if="column.dataIndex === 'linkFile'">
            {{ record.newLinkFile || record.linkFile }}
          </template>
          <template v-if="column.title === '操作'">
            <fa :icon="['fas', 'times']" @click="() => { record.episode = -999 }" style="width: 20px; color: red; cursor: pointer;"></fa>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    const movieColumns = [
      {
        title: '链接文件名称',
        dataIndex: 'linkFile',
        width: 30,
        fixed: true
      }, {
        title: '电影名称',
        dataIndex: 'folderName',
        width: 20
      }, {
        title: '文件名',
        dataIndex: 'file',
        width: 60
      }, {
        title: '操作',
        width: 10
      }
    ];
    const seriesColumns = [
      {
        title: '季',
        dataIndex: 'season',
        width: 16,
        fixed: true
      }, {
        title: '集',
        dataIndex: 'episode',
        width: 16,
        fixed: true
      }, {
        title: '剧集名称',
        dataIndex: 'seriesName',
        width: 25
      }, {
        title: '链接文件名称',
        dataIndex: 'linkFile',
        width: 30
      }, {
        title: '文件名',
        dataIndex: 'file',
        width: 120
      }, {
        title: '操作',
        width: 10
      }
    ];
    return {
      movieColumns,
      seriesColumns,
      hash: '',
      fileList: [],
      subscribes: '',
      selectFile: '',
      libraryPaths: [],
      linkRules: [],
      linkInfo: {
        libraryPath: ''
      },
      torrentInfo: {}
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
    async getTorrentInfo () {
      try {
        const res = await this.$api().torrent.info(this.hash);
        this.torrentInfo = res.data;
        if (this.torrentInfo.scrapeName) {
          this.linkInfo.mediaName = this.torrentInfo.scrapeName;
        }
      } catch (e) {
        await this.$message().error(e.message);
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
    async listSubscribe () {
      try {
        const res = await this.$api().subscribe.list();
        this.subscribes = res.data;
        this.libraryPaths = [{ value: '手动输入' }];
        for (const category of this.subscribes.map(item => item.categories).flat()) {
          if (this.libraryPaths.map(item => item.value).indexOf(category.libraryPath) === -1) {
            this.libraryPaths.push({ value: category.libraryPath });
          }
        }
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    async link (type) {
      try {
        const requestBody = {
          ...this.linkInfo,
          hash: this.hash,
          client: this.torrentInfo.client,
          savePath: this.torrentInfo.savePath,
          keepStruct: this.linkInfo.linkMode !== 'normal',
          replaceTopDir: this.linkInfo.linkMode === 'keepStruct-2',
          keepTopDir: this.linkInfo.linkMode === 'keepStruct-3'
        };
        if (type === 'dryrun') {
          requestBody.dryrun = true;
        } else if (this.linkInfo.linkMode === 'normal') {
          requestBody.files = this.fileList.filter(item => item.episode !== -999).map(item => {
            return {
              season: item.season,
              filepath: item.file,
              folderName: item.folderName,
              seriesName: item.seriesName,
              linkFile: item.newLinkFile || item.linkFile
            };
          });
        }
        const res = await this.$api().torrent.link(requestBody);
        if (type !== 'dryrun') {
          this.$message().success(res.message);
          return;
        }
        this.fileList = res.data;
        if (this.linkInfo.type === 'movie') {
          return;
        }
      } catch (e) {
        this.$message().error(e.message);
      }
      const maxEpisode = ('' + Math.max(10, ...(this.fileList || []).map(item => item.episode))).length;
      this.fileList = this.fileList
        .sort((a, b) => a.file > b.file ? 1 : -1)
        .map(item => {
          return {
            ...item,
            episodeUnlink: false,
            seasonUnlink: false,
            newLinkFile: item.linkFile
              .replace('{SEASON}', 'S' + '0'.repeat(2 - ('' + item.season).length) + item.season)
              .replace('{EPISODE}', 'E' + '0'.repeat(Math.max(0, maxEpisode - ('' + item.episode).length)) + item.episode)
              .replace('{SERIESNAME}', item.seriesName)
          };
        });
    },
    refreshSeason () {
      const maxEpisode = ('' + Math.max(10, ...this.fileList.map(item => item.episode))).length;
      const fileList = this.fileList.filter(item => item.episode !== -999);
      for (const [index, value] of fileList.entries()) {
        if (value.seasonUnlink || index === 0) {
          value.season = +value.season || (+value.season === 0 ? 0 : 1);
        } else {
          value.season = +fileList[index - 1].season || (+fileList[index - 1].season === 0 ? 0 : 1);
        }
        value.newLinkFile = value.linkFile.replace('{SEASON}', 'S' + '0'.repeat(2 - ('' + value.season).length) + value.season)
          .replace('{EPISODE}', 'E' + '0'.repeat(Math.max(0, maxEpisode - ('' + value.episode).length)) + value.episode)
          .replace('{SERIESNAME}', value.seriesName);
      }
    },
    refreshEpisode () {
      const maxEpisode = ('' + Math.max(10, ...this.fileList.map(item => item.episode))).length;
      const fileList = this.fileList.filter(item => item.episode !== -999);
      for (const [index, value] of fileList.entries()) {
        if (value.episodeUnlink || index === 0) {
          value.episode = +value.episode || (+value.episode === 0 ? 0 : 1);
        } else {
          value.episode = (+fileList[index - 1].episode || (+fileList[index - 1].episode === 0 ? 0 : 1)) + 1;
        }
        value.newLinkFile = value.linkFile.replace('{SEASON}', 'S' + '0'.repeat(2 - ('' + value.season).length) + value.season)
          .replace('{EPISODE}', 'E' + '0'.repeat(Math.max(0, maxEpisode - ('' + value.episode).length)) + value.episode)
          .replace('{SERIESNAME}', value.seriesName);
      }
    },
    refreshSeriesName () {
      const maxEpisode = ('' + Math.max(10, ...this.fileList.map(item => item.episode))).length;
      const fileList = this.fileList.filter(item => item.episode !== -999);
      for (const [index, value] of fileList.entries()) {
        if (!value.seriesNameUnlink && index !== 0) {
          value.seriesName = fileList[index - 1].seriesName;
        }
        value.newLinkFile = value.linkFile.replace('{SEASON}', 'S' + '0'.repeat(2 - ('' + value.season).length) + value.season)
          .replace('{EPISODE}', 'E' + '0'.repeat(Math.max(0, maxEpisode - ('' + value.episode).length)) + value.episode)
          .replace('{SERIESNAME}', value.seriesName);
      }
    }
  },
  async mounted () {
    this.hash = this.$route.query.hash;
    if (!this.hash) {
      await this.$message().error('当前页面需要从种子聚合页进入!');
      return;
    }
    this.listSubscribe();
    this.listLinkRule();
    this.getTorrentInfo();
  }
};
</script>
<style scoped>
.link {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
