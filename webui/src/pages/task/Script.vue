<template>
  <div style="font-size: 24px; font-weight: bold;">定时脚本</div>
  <a-divider></a-divider>
  <div class="script">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="scripts"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">定时脚本列表</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'enable'">
          <a-tag color="success" v-if="record.enable">启用</a-tag>
          <a-tag color="error" v-if="!record.enable">禁用</a-tag>
        </template>
        <template v-if="column.dataIndex === 'type'">
          <a-tag color="blue" v-if="record.type === 'external'">外部脚本</a-tag>
          <a-tag color="green" v-else>内联脚本</a-tag>
        </template>
        <template v-if="column.title === '操作'">
          <span>
            <a @click="modifyClick(record)">编辑</a>
            <a-divider type="vertical" />
            <a @click="showLogs(record)">日志</a>
            <a-divider type="vertical" />
            <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
              <template #content>
                <a-button type="primary" danger @click="deleteScript(record)" size="small">删除</a-button>
              </template>
              <a style="color: red">删除</a>
            </a-popover>
          </span>
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑定时脚本</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="script"
        size="small"
        @finish="modifyScript"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给 定时脚本取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="script.alias"/>
        </a-form-item>
        <a-form-item
          label="启用"
          name="enable"
          extra="选择是否启用 定时脚本"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-checkbox v-model:checked="script.enable">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="执行周期"
          name="cron"
          extra="脚本的执行周期, 默认 * * * * * 一分钟执行一次"
          :rules="[{ required: true, message: '${label}不可为空! ' }]">
          <a-input size="small" v-model:value="script.cron"/>
        </a-form-item>

        <!-- Script Type Selector (9.1) -->
        <a-form-item
          label="脚本类型"
          name="type"
          extra="选择内联 JavaScript 脚本或外部脚本文件">
          <a-radio-group v-model:value="script.type" @change="onTypeChange">
            <a-radio value="inline">内联脚本</a-radio>
            <a-radio value="external">外部脚本</a-radio>
          </a-radio-group>
        </a-form-item>

        <!-- Inline Script Code (shown when type is 'inline') -->
        <a-form-item
          v-if="script.type !== 'external'"
          label="Code"
          name="script"
          :rules="[{ required: script.type !== 'external', message: '${label}不可为空! ' }]">
          <a-textarea size="small" v-model:value="script.script" :rows="12"/>
        </a-form-item>

        <!-- External Script Configuration Fields (9.2) -->
        <template v-if="script.type === 'external'">
          <a-form-item
            label="脚本路径"
            name="scriptPath"
            :validateStatus="scriptPathValidation.status"
            :help="scriptPathValidation.message"
            extra="外部脚本文件的完整路径，如 /scripts/u2_scripts/checkin.py"
            :rules="[{ required: true, message: '脚本路径不可为空!' }]">
            <a-input 
              size="small" 
              v-model:value="script.scriptPath"
              @blur="validateScriptPath"
              placeholder="/path/to/script.py"/>
          </a-form-item>

          <a-form-item
            label="工作目录"
            name="workingDir"
            extra="脚本执行时的工作目录，留空则使用脚本所在目录">
            <a-input 
              size="small" 
              v-model:value="script.workingDir"
              placeholder="/path/to/workdir"/>
          </a-form-item>

          <a-form-item
            label="解释器"
            name="interpreter"
            extra="选择用于执行脚本的解释器">
            <a-select 
              size="small" 
              v-model:value="script.interpreter"
              style="width: 200px;">
              <a-select-option value="python">python</a-select-option>
              <a-select-option value="python3">python3</a-select-option>
              <a-select-option value="node">node</a-select-option>
              <a-select-option value="bash">bash</a-select-option>
              <a-select-option value="sh">sh</a-select-option>
              <a-select-option value="custom">自定义命令</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item
            v-if="script.interpreter === 'custom'"
            label="自定义命令"
            name="customCommand"
            extra="自定义执行命令，使用 {script} 作为脚本路径占位符"
            :rules="[{ required: script.interpreter === 'custom', message: '自定义命令不可为空!' }]">
            <a-input 
              size="small" 
              v-model:value="script.customCommand"
              placeholder="python3 -u {script}"/>
          </a-form-item>

          <a-form-item
            label="超时时间"
            name="timeout"
            extra="脚本执行超时时间（秒），默认 300 秒">
            <a-input-number 
              size="small" 
              v-model:value="script.timeout"
              :min="1"
              :max="86400"
              style="width: 120px;"/>
            <span style="margin-left: 8px;">秒</span>
          </a-form-item>

          <!-- Environment Variables Editor (9.3) -->
          <a-form-item
            label="环境变量"
            name="envVars"
            extra="设置脚本执行时的环境变量，如 COOKIE、API_KEY 等">
            <div class="env-vars-editor">
              <div 
                v-for="(envVar, index) in script.envVars" 
                :key="index" 
                class="env-var-row">
                <a-input 
                  size="small" 
                  v-model:value="envVar.key"
                  placeholder="变量名"
                  style="width: 150px; margin-right: 8px;"/>
                <a-input-password 
                  size="small" 
                  v-model:value="envVar.value"
                  placeholder="变量值"
                  style="width: 250px; margin-right: 8px;"
                  :visibilityToggle="true"/>
                <a-button 
                  size="small" 
                  type="text" 
                  danger 
                  @click="removeEnvVar(index)">
                  <template #icon><delete-outlined /></template>
                </a-button>
              </div>
              <a-button 
                size="small" 
                type="dashed" 
                @click="addEnvVar"
                style="margin-top: 8px;">
                <template #icon><plus-outlined /></template>
                添加环境变量
              </a-button>
            </div>
          </a-form-item>
        </template>

        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">应用 | 完成</a-button>
          <a-button type="primary" @click="run" style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;">立即执行一次</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;"  @click="clearScript()">清空</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- Execution Logs Modal (10.2) -->
    <a-modal
      v-model:open="logsModalVisible"
      :title="`执行日志 - ${logsScriptAlias}`"
      :width="800"
      :footer="null"
      @cancel="closeLogsModal">
      <div class="execution-logs">
        <a-spin :spinning="logsLoading">
          <div v-if="executionLogs.length === 0" class="no-logs">
            <a-empty description="暂无执行日志" />
          </div>
          <a-collapse v-else accordion>
            <a-collapse-panel 
              v-for="(log, index) in executionLogs" 
              :key="index"
              :header="formatLogHeader(log)">
              <template #extra>
                <a-tag :color="log.success ? 'success' : 'error'">
                  {{ log.success ? '成功' : '失败' }}
                </a-tag>
                <a-tag v-if="log.timedOut" color="warning">超时</a-tag>
              </template>
              <div class="log-details">
                <div class="log-info">
                  <span><strong>退出码:</strong> {{ log.exitCode }}</span>
                  <span><strong>耗时:</strong> {{ formatDuration(log.duration) }}</span>
                  <span v-if="log.timedOut"><strong>状态:</strong> 执行超时</span>
                </div>
                <div v-if="log.stdout" class="log-output">
                  <div class="log-label">标准输出 (stdout):</div>
                  <pre class="log-content">{{ log.stdout }}</pre>
                </div>
                <div v-if="log.stderr" class="log-output">
                  <div class="log-label">错误输出 (stderr):</div>
                  <pre class="log-content log-error">{{ log.stderr }}</pre>
                </div>
                <div v-if="log.error" class="log-output">
                  <div class="log-label">错误信息:</div>
                  <pre class="log-content log-error">{{ log.error }}</pre>
                </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </a-spin>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue';

export default {
  components: {
    DeleteOutlined,
    PlusOutlined
  },
  data () {
    const columns = [
      {
        title: 'ID',
        dataIndex: 'id',
        width: 18,
        fixed: true
      }, {
        title: '别名',
        dataIndex: 'alias',
        width: 20
      }, {
        title: '类型',
        dataIndex: 'type',
        width: 15
      }, {
        title: '启用',
        dataIndex: 'enable',
        width: 15
      }, {
        title: '周期',
        dataIndex: 'cron',
        width: 24
      }, {
        title: '操作',
        width: 28
      }
    ];
    return {
      columns,
      scripts: [],
      script: {},
      defaultScript: {
        enable: true,
        cron: '* * * * *',
        type: 'inline',
        script: 'logger.info(\'VERTEX IS THE BEST!\')',
        // External script defaults
        scriptPath: '',
        workingDir: '',
        interpreter: 'bash',
        customCommand: '',
        envVars: [],
        timeout: 300
      },
      loading: true,
      scriptPathValidation: {
        status: '',
        message: ''
      },
      // Execution logs modal state (10.2)
      logsModalVisible: false,
      logsLoading: false,
      logsScriptAlias: '',
      logsScriptId: '',
      executionLogs: []
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
    async listScript () {
      this.loading = true;
      try {
        const res = await this.$api().script.list();
        this.scripts = res.data;
      } catch (e) {
        this.$message().error(e.message);
      }
      this.loading = false;
    },
    async modifyScript () {
      // Validate external script fields before submission (9.4)
      if (this.script.type === 'external') {
        if (!this.script.scriptPath) {
          this.$message().error('脚本路径不可为空!');
          return;
        }
        if (this.script.interpreter === 'custom' && !this.script.customCommand) {
          this.$message().error('自定义命令不可为空!');
          return;
        }
        // Filter out empty environment variables
        this.script.envVars = (this.script.envVars || []).filter(
          env => env.key && env.key.trim()
        );
      }
      
      try {
        await this.$api().script.modify({ ...this.script });
        this.$message().success((this.script.id ? '编辑' : '新增') + '成功, 列表正在刷新...');
        setTimeout(() => this.listScript(), 1000);
        this.clearScript();
      } catch (e) {
        // Handle validation errors from backend (9.4)
        if (e.response && e.response.data && e.response.data.message) {
          this.$message().error(e.response.data.message);
        } else {
          this.$message().error(e.message);
        }
      }
    },
    async run () {
      try {
        const res = await this.$api().script.run({ ...this.script });
        if (res.success) {
          this.$message().success('执行成功, 执行结果请查看日志');
        } else {
          this.$message().error(res.message || '执行失败');
        }
        setTimeout(() => this.listScript(), 1000);
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      // Ensure all external script fields have defaults when editing
      this.script = { 
        ...this.defaultScript,
        ...row,
        envVars: row.envVars ? [...row.envVars] : []
      };
      this.scriptPathValidation = { status: '', message: '' };
    },
    async deleteScript (row) {
      try {
        await this.$api().script.delete(row.id);
        this.$message().success('删除成功, 列表正在刷新...');
        await this.listScript();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    clearScript () {
      this.script = {
        ...this.defaultScript,
        envVars: []
      };
      this.scriptPathValidation = { status: '', message: '' };
    },
    // Script type change handler (9.1)
    onTypeChange () {
      this.scriptPathValidation = { status: '', message: '' };
    },
    // Script path validation (9.2)
    async validateScriptPath () {
      if (!this.script.scriptPath) {
        this.scriptPathValidation = { status: '', message: '' };
        return;
      }
      // Note: Full validation happens on backend during save
      // This is just a UI hint
      this.scriptPathValidation = { 
        status: 'validating', 
        message: '路径将在保存时验证' 
      };
    },
    // Environment variable management (9.3)
    addEnvVar () {
      if (!this.script.envVars) {
        this.script.envVars = [];
      }
      this.script.envVars.push({ key: '', value: '' });
    },
    removeEnvVar (index) {
      this.script.envVars.splice(index, 1);
    },
    // Execution logs methods (10.2)
    async showLogs (record) {
      this.logsScriptAlias = record.alias || record.id;
      this.logsScriptId = record.id;
      this.logsModalVisible = true;
      this.logsLoading = true;
      this.executionLogs = [];
      
      try {
        const res = await this.$api().script.getLogs(record.id);
        if (res.success) {
          // Sort logs by timestamp descending (most recent first)
          this.executionLogs = (res.data || []).sort((a, b) => b.timestamp - a.timestamp);
        } else {
          this.$message().error(res.message || '获取日志失败');
        }
      } catch (e) {
        this.$message().error(e.message || '获取日志失败');
      }
      
      this.logsLoading = false;
    },
    closeLogsModal () {
      this.logsModalVisible = false;
      this.executionLogs = [];
      this.logsScriptAlias = '';
      this.logsScriptId = '';
    },
    formatLogHeader (log) {
      const date = new Date(log.timestamp);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    formatDuration (duration) {
      if (!duration) return '0ms';
      if (duration < 1000) return `${duration}ms`;
      if (duration < 60000) return `${(duration / 1000).toFixed(2)}s`;
      return `${(duration / 60000).toFixed(2)}min`;
    }
  },
  async mounted () {
    this.clearScript();
    this.listScript();
  }
};
</script>
<style scoped>
.script {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}

.env-vars-editor {
  display: flex;
  flex-direction: column;
}

.env-var-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

/* Execution logs styles (10.2) */
.execution-logs {
  max-height: 500px;
  overflow-y: auto;
}

.no-logs {
  padding: 40px 0;
}

.log-details {
  padding: 8px 0;
}

.log-info {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  font-size: 13px;
}

.log-output {
  margin-top: 12px;
}

.log-label {
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 13px;
}

.log-content {
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 8px 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}

.log-error {
  background-color: #fff2f0;
  border-color: #ffccc7;
  color: #cf1322;
}
</style>
