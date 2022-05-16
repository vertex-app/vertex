<template>
  <div class="home">
    <div class="radius-div">
      <el-descriptions style="padding: 24px" title="版本信息" :column="4">
        <el-descriptions-item
          label="主版本">
          <el-link
            style="color: blue"
            @click="gotoVersion">
            {{this.version.version}}
          </el-link>
        </el-descriptions-item>
        <el-descriptions-item
          label="次版本">
          <el-link
            style="color: blue"
            @click="gotoVersion">
            {{this.version.head}}
          </el-link>
        </el-descriptions-item>
        <el-descriptions-item
          label="更新时间">
          {{this.version.updateTime}}
        </el-descriptions-item>
        <el-descriptions-item
          label="更新信息">
          {{this.version.commitInfo}}
        </el-descriptions-item>
      </el-descriptions>
      <el-descriptions style="padding: 24px" title="使用帮助" :column="4">
        <el-descriptions-item
          label="文档">
          <el-link style="color: blue" @click="gotoDoc()">文档</el-link>
        </el-descriptions-item>
        <el-descriptions-item
          label="QQ 交流群组">
          刷流: 852643057
          <br>
          追剧: 926921776
        </el-descriptions-item>
        <el-descriptions-item
          label="Telegram">
          <el-link style="color: blue" @click="gotoGroup()">交流群组</el-link>
          <br>
          <el-link style="color: blue" @click="gotoChannel()">更新推送</el-link>
        </el-descriptions-item>
        <el-descriptions-item
          label="开源地址">
          <el-link style="color: blue" @click="gotoGitlab()">Gitlab</el-link>
          <br>
          <el-link style="color: blue" @click="gotoGithub()">Github</el-link>
        </el-descriptions-item>
      </el-descriptions>
      <el-descriptions style="padding: 24px" title="任务信息" :column="3">
        <el-descriptions-item
          label="运行时间">
          {{$moment(runInfo.startTime * 1000).format('YYYY-MM-DD HH:mm:ss')}}<br>{{$moment(runInfo.startTime * 1000).fromNow()}}
        </el-descriptions-item>
        <el-descriptions-item
          label="今日上传">
          {{$formatSize(runInfo.uploadedToday)}}
        </el-descriptions-item>
        <el-descriptions-item
          label="今日下载">
          {{$formatSize(runInfo.downloadedToday)}}
        </el-descriptions-item>
        <el-descriptions-item
          label="今日添加种子">
          {{runInfo.addCountToday}}
        </el-descriptions-item>
        <el-descriptions-item
          label="今日拒绝种子">
          {{runInfo.rejectCountToday}}
        </el-descriptions-item>
        <el-descriptions-item
          label="今日删除种子">
          {{runInfo.deleteCountToday}}
        </el-descriptions-item>
        <el-descriptions-item
          label="累计上传">
          {{$formatSize(runInfo.uploaded)}}
        </el-descriptions-item>
        <el-descriptions-item
          :span="2"
          label="累计下载">
          {{$formatSize(runInfo.downloaded)}}
        </el-descriptions-item>
        <el-descriptions-item
          label="累计添加种子">
          {{runInfo.addCount}}
        </el-descriptions-item>
        <el-descriptions-item
          label="累计拒绝种子">
          {{runInfo.rejectCount}}
        </el-descriptions-item>
        <el-descriptions-item
          label="累计删除种子">
          {{runInfo.deleteCount}}
        </el-descriptions-item>
      </el-descriptions>
      <div style="padding: 24px;">
        <el-table
          :data="runInfo.perTrackerToday">>
          <el-table-column
            prop="tracker"
            label="今日流量"
            width="256px">
            <template slot-scope="scope">
              {{scope.row.tracker || '已删除'}}
            </template>
          </el-table-column>
          <el-table-column
            label="上传">
            <template slot-scope="scope">
              {{$formatSize(scope.row.uploaded)}}
            </template>
          </el-table-column>
          <el-table-column
            label="下载">
            <template slot-scope="scope">
              {{$formatSize(scope.row.downloaded)}}
            </template>
          </el-table-column>
        </el-table>
        <el-divider/>
        <el-table
          :data="runInfo.perTracker">
          <el-table-column
            prop="tracker"
            label="累计流量"
            width="256px">
            <template slot-scope="scope">
              {{scope.row.tracker || '已删除'}}
            </template>
          </el-table-column>
          <el-table-column
            label="上传">
            <template slot-scope="scope">
              {{$formatSize(scope.row.uploaded)}}
            </template>
          </el-table-column>
          <el-table-column
            label="下载">
            <template slot-scope="scope">
              {{$formatSize(scope.row.downloaded)}}
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
      version: 'dev',
      runInfo: {
        perTracker: [],
        perTrackerToday: []
      }
    };
  },
  methods: {
    async getRunInfo () {
      const res = await this.$axiosGet('/api/setting/getRunInfo');
      this.runInfo = res ? res.data : {};
    },
    async gotoChannel () {
      window.open('https://t.me/lswl_vertex');
    },
    async gotoGroup () {
      window.open('https://t.me/group_vertex');
    },
    async gotoDoc () {
      window.open('https://docs.vertex.icu');
    },
    async gotoVersion () {
      window.open('https://lswl.in/2022/01/14/vertex-changelog');
    },
    async gotoGithub () {
      window.open('https://github.com/l-s-w-l/Vertex');
    },
    async gotoGitlab () {
      window.open('https://gitlab.lswl.in/lswl/vertex');
    }
  },
  mounted () {
    this.getRunInfo();
    this.version = process.env.version || this.version;
  }
};
</script>

<style scoped>
</style>
