# Design Document: VERTEX Install Script & External Script Runner

## Overview

本设计文档描述两个功能的实现方案：
1. **VERTEX 一键安装脚本** - 一个 shell 脚本，用于在 Linux 服务器上快速部署 VERTEX
2. **外部脚本运行功能** - 扩展现有的定时脚本功能，支持运行外部脚本文件（如 Python、Shell 脚本）

## Architecture

### Part 1: Install Script Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    install.sh                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Dependency  │  │   Config    │  │   Docker Compose    │  │
│  │   Check     │──│  Generator  │──│      Setup          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         ▼                ▼                    ▼              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Error     │  │  Directory  │  │   Container         │  │
│  │  Handler    │  │   Setup     │  │   Management        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Part 2: External Script Runner Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VERTEX Application                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Script Module                       │    │
│  │  ┌───────────────┐    ┌───────────────────────┐     │    │
│  │  │ Inline JS     │    │  External Script      │     │    │
│  │  │ (existing)    │    │  Runner (new)         │     │    │
│  │  └───────────────┘    └───────────────────────┘     │    │
│  │                              │                       │    │
│  │                              ▼                       │    │
│  │                    ┌─────────────────────┐          │    │
│  │                    │  child_process.spawn │          │    │
│  │                    └─────────────────────┘          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  WebUI (Vue.js)                      │    │
│  │  ┌───────────────────────────────────────────────┐  │    │
│  │  │  Script.vue (extended)                        │  │    │
│  │  │  - Script type selector                       │  │    │
│  │  │  - External script config fields              │  │    │
│  │  │  - Environment variables editor               │  │    │
│  │  └───────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Part 1: Install Script Components

#### 1.1 install.sh

主安装脚本，包含以下函数：

```bash
# 检查依赖
check_dependencies()

# 生成随机密码
generate_password()

# 创建目录结构
setup_directories()

# 生成 docker-compose.yml
generate_docker_compose()

# 启动服务
start_services()

# 显示安装结果
show_result()

# 错误处理
handle_error()

# 清理函数
cleanup()
```

#### 1.2 docker-compose.yml 模板

```yaml
version: '3'
services:
  vertex:
    image: lswl/vertex:stable
    container_name: vertex
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - ./data:/vertex
    environment:
      - TZ=Asia/Shanghai
```

### Part 2: External Script Runner Components

#### 2.1 ExternalScript.js (新增)

外部脚本执行器类：

```javascript
class ExternalScript {
  constructor(config) {
    this.id = config.id;
    this.alias = config.alias;
    this.cron = config.cron;
    this.scriptPath = config.scriptPath;
    this.workingDir = config.workingDir;
    this.interpreter = config.interpreter;
    this.customCommand = config.customCommand;
    this.envVars = config.envVars;
    this.timeout = config.timeout || 300;
    this.enable = config.enable;
  }

  async execute() { /* ... */ }
  destroy() { /* ... */ }
}
```

#### 2.2 ScriptMod.js (扩展)

扩展现有模型以支持外部脚本：

```javascript
// 新增字段
{
  type: 'external',        // 'inline' | 'external'
  scriptPath: '/path/to/script.py',
  workingDir: '/path/to/workdir',
  interpreter: 'python3',  // 'python' | 'python3' | 'node' | 'bash' | 'sh' | 'custom'
  customCommand: '',       // 自定义执行命令
  envVars: [               // 环境变量
    { key: 'COOKIE', value: 'xxx' }
  ],
  timeout: 300             // 超时时间（秒）
}
```

#### 2.3 Script.vue (扩展)

扩展前端界面以支持外部脚本配置。

### API Interfaces

#### 外部脚本 API

现有 API 保持不变，扩展请求/响应数据结构：

```javascript
// POST /api/script/modify
{
  id: 'abc123',
  alias: 'U2 签到脚本',
  enable: true,
  cron: '0 8 * * *',
  type: 'external',
  scriptPath: '/scripts/u2_scripts/checkin.py',
  workingDir: '/scripts/u2_scripts',
  interpreter: 'python3',
  envVars: [
    { key: 'U2_COOKIE', value: '***' }
  ],
  timeout: 300
}
```

## Data Models

### Script Configuration (扩展)

```javascript
{
  // 基础字段（现有）
  id: String,
  alias: String,
  enable: Boolean,
  cron: String,
  
  // 脚本类型
  type: 'inline' | 'external',
  
  // 内联脚本字段（现有）
  script: String,
  
  // 外部脚本字段（新增）
  scriptPath: String,
  workingDir: String,
  interpreter: 'python' | 'python3' | 'node' | 'bash' | 'sh' | 'custom',
  customCommand: String,
  envVars: Array<{ key: String, value: String }>,
  timeout: Number
}
```

### Execution Log (新增)

```javascript
{
  scriptId: String,
  timestamp: Number,
  exitCode: Number,
  stdout: String,
  stderr: String,
  duration: Number,
  timedOut: Boolean
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dependency Detection Accuracy
*For any* system state with Docker installed or not installed, the Install_Script dependency check SHALL correctly detect the presence or absence of Docker.
**Validates: Requirements 1.1**

### Property 2: Directory Creation with Permissions
*For any* valid Installation_Directory path, the Install_Script SHALL create the directory with permissions that allow the VERTEX container to read and write.
**Validates: Requirements 2.1**

### Property 3: Password Generation Security
*For any* generated password, the password SHALL be at least 16 characters long and contain a mix of alphanumeric characters.
**Validates: Requirements 2.2**

### Property 4: Cleanup on Failure
*For any* installation failure, the Install_Script SHALL remove all partially created resources (directories, files) that were created during the failed installation attempt.
**Validates: Requirements 4.3**

### Property 5: Script Path Validation
*For any* script path provided by the user, the Script_Task SHALL correctly identify whether the path exists on the filesystem and return an appropriate validation result.
**Validates: Requirements 5.3**

### Property 6: Configuration Persistence
*For any* valid External_Script configuration, saving the configuration SHALL result in the configuration being retrievable from storage with identical values.
**Validates: Requirements 5.4**

### Property 7: Environment Variable Injection
*For any* External_Script with configured environment variables, executing the script SHALL make all configured environment variables available in the script's execution context.
**Validates: Requirements 6.2**

### Property 8: Interpreter Execution
*For any* External_Script with a specified interpreter or custom command, the Script_Task SHALL execute the script using the specified interpreter or custom command string.
**Validates: Requirements 7.2, 7.3**

### Property 9: Cron Schedule Parsing
*For any* valid cron expression, the Script_Task SHALL correctly parse and schedule the script to run at the times specified by the expression.
**Validates: Requirements 8.1**

### Property 10: Disabled Script Non-Execution
*For any* disabled External_Script, the Script_Task SHALL not execute the script regardless of the cron schedule.
**Validates: Requirements 8.3**

### Property 11: Execution Result Reporting
*For any* External_Script execution, the Script_Task SHALL correctly report the execution result as success (exit code 0) or failure (non-zero exit code).
**Validates: Requirements 9.3**

### Property 12: Output Capture Completeness
*For any* External_Script execution, the Script_Task SHALL capture all stdout and stderr output and record any error messages with the exit code.
**Validates: Requirements 10.1, 10.3**

### Property 13: Timeout Enforcement
*For any* External_Script execution that exceeds the configured timeout, the Script_Task SHALL terminate the process and log the timeout event with the configured timeout value.
**Validates: Requirements 11.2, 11.3**

## Error Handling

### Install Script Errors

| Error Type | Handling |
|------------|----------|
| Docker not installed | 显示安装 Docker 的命令，退出脚本 |
| Docker Compose not installed | 显示安装 Docker Compose 的命令，退出脚本 |
| Permission denied | 提示使用 sudo 运行，退出脚本 |
| Network error | 提示检查网络连接，退出脚本 |
| Container start failed | 显示 docker logs 命令，清理资源，退出脚本 |

### External Script Runner Errors

| Error Type | Handling |
|------------|----------|
| Script path not found | 记录错误日志，不执行脚本 |
| Interpreter not found | 记录错误日志，不执行脚本 |
| Permission denied | 记录错误日志，返回执行失败 |
| Timeout | 终止进程，记录超时日志 |
| Non-zero exit code | 记录 stderr 和 exit code |

## Testing Strategy

### Property-Based Testing

使用 **fast-check** 库进行属性测试。

每个属性测试必须：
- 运行至少 100 次迭代
- 使用注释标记对应的正确性属性：`**Feature: vertex-install-script, Property {number}: {property_text}**`

### Unit Testing

使用 **Jest** 进行单元测试。

#### Install Script Tests
- 依赖检查函数测试
- 密码生成函数测试
- 目录创建函数测试
- Docker Compose 生成测试

#### External Script Runner Tests
- 脚本配置验证测试
- 脚本执行测试
- 超时处理测试
- 日志记录测试

### Integration Testing

- 完整安装流程测试（使用 Docker-in-Docker）
- 外部脚本端到端执行测试
