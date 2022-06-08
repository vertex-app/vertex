<template>
  <div>
    <div class="radius-div">
      <div style="margin: 20px auto; padding: 20px 0;">
        <el-form style="padding-left: 32px; text-align: left;" label-width="160px" label-position="left" size="mini">
          <el-form-item label="下载器">
            <span>{{ this.torrentInfo.clientAlias }}</span>
          </el-form-item>
          <el-form-item label="操作种子">
            <span>{{ this.torrentInfo.name }}</span>
          </el-form-item>
          <el-form-item label="种子hash">
            <span>{{ this.hash }}</span>
          </el-form-item>
          <el-form-item label="种子大小">
            <span>{{ $formatSize(this.torrentInfo.size) }}</span>
          </el-form-item>
          <el-form-item label="保存路径">
            <span>{{ this.torrentInfo.savePath }}</span>
          </el-form-item>
          <el-form-item label="选择链接规则">
            <el-select v-model="linkRule" style="width: 200px" placeholder="选择链接规则">
              <el-option v-for="rule of linkRuleList" :key="rule.id" :label="rule.alias" :value="rule.id">{{rule.alias}}</el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="分类">
            <el-select v-model="type" style="width: 200px" placeholder="分类">
              <el-option label="电影" value="movie"></el-option>
              <el-option label="剧集" value="series"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="资料库文件夹">
            <el-input v-model="libraryPath" type="input" style="width: 200px;" placeholder="资料库文件夹"></el-input>
          </el-form-item>
          <el-form-item label="影视剧名">
            <el-input v-model="mediaName" type="input" style="width: 200px;" placeholder="影视剧名"></el-input>
          </el-form-item>
          <el-form-item size="small">
            <el-button type="primary" @click="dryrun">检查</el-button>
            <el-button type="danger" @click="startLink" style="margin-left: 36px;">执行</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div style="padding: 24px; font-size: 14px; text-align: left;" v-if="fileList[0].file">
        <el-select
          filterable
          size="mini"
          style="width: calc(100% - 144px);"
          v-model="selectFile"
          placeholder="新增">
          <el-option
            v-for="item in fileList"
            :key="item.file"
            :disabled="item.episode !== -999"
            :label="item.file"
            :value="item.file">
          </el-option>
        </el-select>
        <el-button size="mini" type="primary" @click="() => { fileList.filter(item => item.file === selectFile)[0].episode = 0; selectFile = '' }">新增</el-button>
      </div>
      <div style="padding: 24px; font-size: 14px;">
        <el-table
          :data="fileList.filter(item => item.episode !== -999)"
          fit
          size="small">
          <el-table-column
            prop="file"
            v-if="fileList[0].file"
            label="文件名">
          </el-table-column>
          <el-table-column
            prop="seriesName"
            width="144"
            v-if="fileList[0].seriesName"
            label="剧集名称">
          </el-table-column>
          <el-table-column
            prop="season"
            width="114"
            v-if="fileList[0].season !== undefined"
            label="季">
            <template slot-scope="scope">
              <el-input v-model="scope.row.season" @change="() => refreshSeason()" style="width: 64px; display: inline-block" size="mini"/>
              <fa v-if="!scope.row.seasonUnlink" @click="() => { scope.row.seasonUnlink = true; }" :icon="['fas', 'link']" style="width: 20px; color: lightcyan; cursor: pointer;"></fa>
              <fa v-if="scope.row.seasonUnlink" @click="() => { scope.row.seasonUnlink = false; }" :icon="['fas', 'unlink']" style="width: 20px; color: red; cursor: pointer;"></fa>
            </template>
          </el-table-column>
          <el-table-column
            prop="episode"
            width="114"
            v-if="fileList[0].episode !== undefined"
            label="集">
            <template slot-scope="scope">
              <el-input v-model="scope.row.episode" @change="() => refreshEpisode()" style="width: 64px; display: inline-block" size="mini"/>
              <fa v-if="!scope.row.episodeUnlink" @click="() => { scope.row.episodeUnlink = true; }" :icon="['fas', 'link']" style="width: 20px; color: lightcyan; cursor: pointer;"></fa>
              <fa v-if="scope.row.episodeUnlink" @click="() => { scope.row.episodeUnlink = false; }" :icon="['fas', 'unlink']" style="width: 20px; color: red; cursor: pointer;"></fa>
            </template>
          </el-table-column>
          <el-table-column
            prop="folderName"
            width="144"
            v-if="fileList[0].folderName"
            label="影视名称">
          </el-table-column>
          <el-table-column
            prop="linkFile"
            width="320"
            v-if="fileList[0].file"
            label="链接文件名称">
            <template slot-scope="scope">
              {{ scope.row.newLinkFile || scope.row.linkFile }}
            </template>
          </el-table-column>
          <el-table-column
            width="114"
            v-if="fileList[0].file"
            label="操作">
            <template slot-scope="scope">
              <fa :icon="['fas', 'times']" @click="() => { scope.row.episode = -999 }" style="width: 20px; color: red; cursor: pointer;"></fa>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      linkRuleList: [],
      fileList: [{
      }],
      selectFile: '',
      torrentInfo: {},
      hash: '',
      libraryPath: '',
      mediaName: '',
      type: '',
      linkRule: ''
    };
  },
  methods: {
    async getTorrentInfo () {
      const res = await this.$axiosGet('/api/torrent/info?hash=' + this.hash);
      this.torrentInfo = res?.data;
      if (this.torrentInfo.scrapeName) {
        this.mediaName = this.torrentInfo.scrapeName;
      }
    },
    async listLinkRule () {
      const res = await this.$axiosGet('/api/linkRule/list');
      this.linkRuleList = res ? res.data.sort((a, b) => a.alias > b.alias ? 1 : -1) : [];
    },
    async startLink () {
      const res = await this.$axiosPost('/api/torrent/link', {
        hash: this.hash,
        type: this.type,
        mediaName: this.mediaName,
        linkRule: this.linkRule,
        client: this.torrentInfo.client,
        libraryPath: this.libraryPath,
        savePath: this.torrentInfo.savePath,
        files: this.fileList.filter(item => item.episode !== -999).map(item => {
          return {
            season: item.season,
            filepath: item.file,
            folderName: item.folderName,
            seriesName: item.seriesName,
            linkFile: item.newLinkFile || item.linkFile
          };
        })
      });
      if (!res) {
        return;
      }
      await this.$messageBox(res);
    },
    async dryrun () {
      const res = await this.$axiosPost('/api/torrent/link', {
        dryrun: true,
        hash: this.hash,
        type: this.type,
        mediaName: this.mediaName,
        linkRule: this.linkRule,
        client: this.torrentInfo.client,
        libraryPath: this.libraryPath,
        savePath: this.torrentInfo.savePath
      });
      if (this.type === 'movie') {
        this.fileList = res?.data;
        return;
      }
      const maxEpisode = ('' + Math.max(10, ...(res?.data || []).map(item => item.episode))).length;
      this.fileList = res?.data
        .sort((a, b) => a.file > b.file ? 1 : -1)
        .map(item => {
          return {
            ...item,
            episodeUnlink: false,
            seasonUnlink: false,
            newLinkFile: item.linkFile
              .replace('{SEASON}', 'S' + '0'.repeat(2 - ('' + item.season).length) + item.season)
              .replace('{EPISODE}', 'E' + '0'.repeat(Math.max(0, maxEpisode - ('' + item.episode).length)) + item.episode)
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
          .replace('{EPISODE}', 'E' + '0'.repeat(Math.max(0, maxEpisode - ('' + value.episode).length)) + value.episode);
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
          .replace('{EPISODE}', 'E' + '0'.repeat(Math.max(0, maxEpisode - ('' + value.episode).length)) + value.episode);
      }
    }
  },
  async mounted () {
    this.hash = this.$route.query.hash;
    if (!this.hash) {
      await this.$message.error('当前页面需要从种子聚合页进入!');
      return;
    }
    await this.getTorrentInfo();
    await this.listLinkRule();
  }
};
</script>

<style scoped>
.el-form-item {
  margin: 12px 0;
  margin-bottom: 0;
}
</style>
