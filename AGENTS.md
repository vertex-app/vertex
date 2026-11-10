# AGENTS.md

## 项目概述
Vertex 是适用于 PT 玩家的追剧、刷流综合管理工具。README 说明项目目前仅做问题修复，不新增功能。
后端入口为 `app/app.js`，前端位于 `webui/`；前后端当前项目版本均为 `0.0.14.0`。

## 开发环境
使用 Node.js 26.13.0、npm 11.20.0，版本文件为 `.nvmrc`，前后端 package.json 均声明运行版本。后端使用 Express 和 SQLite（better-sqlite3 13.0.3），前端使用 Vue 3、Vue CLI 5.0.9、Ant Design Vue。
2026-11-09 已将本机开发服务切换为 Node 26：前端 `http://localhost:8081/`，后端 HTTP 4000。原项目 Redis 实例已停止，6379 无监听，后端无需 Redis。
本次使用的隔离运行时位于 `/tmp/vertex-node26/node_modules/node/bin/node`。后端启动参数为 `PORT=4000 HTTPS_ENABLE=false NODE_ENV=development`，前端在 webui 下执行 Vue CLI serve 并指定 8081；PATH 需优先包含 Node 26 目录。
本机浏览器使用 `/usr/bin/google-chrome`，开发后端设置 `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome PUPPETEER_HEADLESS=true`。容器默认使用 `/usr/bin/chromium` 和 Xvfb 有头模式，按需设置 `PUPPETEER_HEADLESS=true` 可切换无头模式。
服务 PID 文件在 `/tmp/vertex-dev-services/`，当前日志为 `backend-node26.log`、`frontend-node26.log`。日志可能包含业务数据，不直接公开。停止进程前必须通过 netstat 核实 PID。
重启前数据库备份为 `/tmp/vertex-node26-data-backup-ov1uh4at/sql.db`，父目录权限 700、文件权限 600；该文件含业务数据，不应公开。
后端和测试静态检查使用 `npm run eslint`，测试使用 `npm test`，前端检查为 `npm run eslint --prefix webui`。构建产物 app/static 由 .eslintignore 排除。主题准备为 `npm run prepare:themes --prefix webui`。
根 package.json 的 allowScripts 允许 ssh2 安装脚本；禁用 utf-8-validate 和 cpu-features 的原生构建脚本，前者使用官方 JavaScript 回退，后者为 SSH 可选加速模块。SQLite 使用包内预编译模块，Puppeteer 使用系统浏览器，node-cron 的赞助脚本不执行。隔离生产依赖安装已通过，包含 linuxmusl-x64/arm64 预编译文件；Alpine 实际加载由应用 Dockerfile 的运行阶段校验。

## 测试账号
不保存真实测试凭据。会话集成测试使用临时 HTTP 服务与进程内账号，不修改应用账号配置。

## 常见问题
2026-11-10 后端曾因 SSH 终端请求退出：ServerMod.shell 直接读取不存在的 runningServer 项，控制器未等待并捕获异步异常。现已对未启用/不存在的服务器返回明确提示，捕获控制器拒绝、SSH/流错误与 WebSocket 关闭竞争，并隐藏禁用服务器的终端入口。新增 5 项回归测试，完整 24 项测试及相关 ESLint 通过；后端已恢复，4000 与前端代理返回预期 401，登录页返回 200。恢复后原会话失效，需重新登录。未修改服务器启用状态或连接凭据。
内存状态仅适用于单 Node.js 主进程，不支持 cluster、多 worker 或多副本共享状态。重启会清空会话、缓存和临时交互，需要重新登录；SQLite 和配置文件继续持久化。
内存默认总计账额度 64 MiB，可重建缓存 32 MiB、会话 16 MiB、业务状态 8 MiB、交互 4 MiB。通过 `VERTEX_MEMORY_TOTAL_MB`、`VERTEX_MEMORY_CACHE_MB`、`VERTEX_MEMORY_SESSIONS_MB`、`VERTEX_MEMORY_STATE_MB`、`VERTEX_MEMORY_INTERACTION_MB` 覆盖，取值为 1 到 4096 的整数。额度是模块估算，不是进程 RSS 硬上限。
会话和业务状态不会被普通缓存 LRU 淘汰；容量不足时明确失败或等待下轮重试。最近五条错误使用独立有界队列。
Vue CLI 的 IPC 传递依赖已固定到 @achrinza/node-ipc 9.2.10，其 engines 仍仅列到 Node 25，npm 会产生 EBADENGINE 告警；当前 Node 26 下的生产构建和开发服务已验证通过。旧构建工具另有 fs.Stats 弃用和包体积/预缓存告警，尚未迁移至 Vite。
主题生成器只能将源主题变量作为输入，不能扫描生成目录；准备脚本还会检测生成器内部捕获但未返回失败码的 Less 编译错误。
历史 npm 6 无法读取 v3 锁文件的临时 npm 8 处理已移除，当前使用 Node 26/npm 11。

## 其他备忘
2026-11-10 已升级后端运行依赖并刷新锁文件，详见 docs/backend-dependency-upgrade.md。request 改为 @cypress/request，connect-multiparty 改为仅用于已认证备份恢复路由的 multer；上传备份使用权限 700 的独立临时目录并自动清理。UUID 使用 Node.js crypto.randomUUID。bencode 4 通过动态 import 加载，名称字节串需先转 Buffer；node-cron 4 删除任务必须 destroy，不能仅 stop。32 项测试、ESLint、干净生产安装、SQLite、IRC 初始化和系统 Chrome 验证通过。生产审计由 38 项降至 4 项低危，剩余来自 Puppeteer 插件的 deepmerge，尚无上游修复版本。Express 保留最新 4.x；ESLint 主版本迁移、crypto-js 停更后的替代及 Alpine 容器验证仍待处理。
两套方案及实施状态见 `docs/plans/node26-upgrade.md`、`docs/plans/remove-redis.md`。应用 Dockerfile 的两个阶段使用维护者已发布的 `lswl/vertex-base:26`，构建时校验 Node 主版本和原生 SQLite 实际加载，并移除旧基础镜像中可能存在的 Redis 包。
独立基础镜像 Dockerfile 为 `docker/vertex-base/Dockerfile`，保留维护者的 Alpine 3.24 + apk nodejs/npm 方式，已删除 Redis。字体配置 COPY 仍沿用原 src/local.conf；维护者已自行找回该文件，当前仓库未包含该字体文件，不重新生成其内容。后续重建基础镜像可进一步去除旧镜像层中的 Redis 文件。
GitHub Actions 检查任务从 .nvmrc 读取版本，执行前后端及辅助脚本 ESLint、内存/会话/原生模块测试、主题生成和前端构建。PR 不发布镜像；仅 stable 更新 latest，另有分支、版本和提交 SHA 标签。newnode 分支推送会触发检查并发布 lswl/vertex:newnode 及提交 SHA 标签，用于 Node 26 与内存状态实现的预发布验证。Docker Hub Secrets 继续使用 DOCKER_USERNAME、DOCKER_PASSWORD。
2026-11-09 已通过 19 项自动测试、真实路由登录/退出、原数据库模板完整性检查、本地 SSH 握手与命令通道、Node 26 下的主题及生产构建、系统 Chrome + 新版 Puppeteer/stealth 隔离上下文验证，以及无 Redis 的开发服务启动；真实浏览器登录页渲染正常且无页面脚本异常。本次未执行 Docker 构建、Git 提交或推送；amd64/arm64 Alpine 容器集成仍待 CI 验证。
