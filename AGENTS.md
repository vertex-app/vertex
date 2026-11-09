# AGENTS.md

## 项目概述
Vertex 是适用于 PT 玩家的追剧、刷流综合管理工具。README 说明项目目前仅做问题修复，不新增功能。
后端代码位于 `app/`，入口为 `app/app.js`；前端代码位于 `webui/`。

## 开发环境
后端使用 Node.js、Express，依赖 SQLite（better-sqlite3）和 Redis；前端使用 Vue 3、Ant Design Vue 和 Vue CLI。
根目录与 `webui/` 分别维护 `package.json`，当前版本均为 `0.0.14.0`。
后端静态检查脚本为 `npm run eslint`；前端静态检查在 `webui/` 中执行 `npm run eslint`。两者均未配置 `test` 脚本。
2026-11-09 本机开发环境已启动：前端 `http://localhost:8081/`（8080 被其他服务占用，Vue CLI 自动选择 8081），后端 HTTP 4000，Redis 仅监听 `127.0.0.1:6379`。Redis PING、前端首页和登录页、API 代理均已验证；未登录访问 `/api/user/get` 返回预期的 401。
兼容运行时为 `/tmp/vertex-dev-runtime/node_modules/node/bin/node`（Node.js 16.20.2），用于项目锁定的 better-sqlite3 7.5.3；该模块已安装对应预编译二进制。前后端依赖通过 `npm ci --ignore-scripts` 安装，未下载 Chromium。
Redis 7.2.6 源码及本地编译产物位于 `/tmp/vertex-dev-redis/redis-7.2.6/`；开发实例使用 `--bind 127.0.0.1 --port 6379 --save '' --appendonly no`，不持久化缓存。未使用管理员权限或 Docker。
服务日志和 PID 记录位于 `/tmp/vertex-dev-services/`，分别为 `redis`、`backend`、`frontend` 的 `.log` 和 `.pid` 文件。日志可能包含业务数据，不应直接公开。停止服务前必须用 `netstat -lntp` 核实 PID。
重新启动后端：在根目录使用兼容 Node 执行 `app/app.js`，环境变量为 `PORT=4000 REDISPORT=6379 HTTPS_ENABLE=false NODE_ENV=development`。重新启动前端：在 `webui/` 使用兼容 Node 执行 `node_modules/@vue/cli-service/bin/vue-cli-service.js serve --port 8081`。先启动 Redis，再启动后端及前端，并将兼容运行时目录加入 PATH。以上 `/tmp` 文件在系统清理后需要重建。
前端开发代理默认连接 `http://127.0.0.1:4000`，可通过 `VUE_APP_API_TARGET` 覆盖；开发模式版本信息使用 package.json 和开发标记，不执行 Git 命令。

## 测试账号
待补充

## 常见问题
Docker 基础镜像的旧 npm 无法读取项目 lockfileVersion 3，会在 `npm ci` 阶段报 `Cannot read property 'bencode' of undefined`。依赖构建阶段需先固定安装 npm 8.19.4，该版本兼容 Node.js 14。2026-11-09 已使用隔离的 Node.js 14.20.1 + npm 6.14.17 复现错误，替换为 npm 8.19.4 后 379 个生产依赖安装通过；验证命令带 `--ignore-scripts`，未覆盖原生模块编译。测试工具和依赖位于 `/tmp/vertex-npm-compat/`。

## 其他备忘
GitHub Actions 工作流为 `.github/workflows/build-docker-image.yml`：PR 目标分支及推送分支为 dev、stable、release，另支持 v* 标签与手动触发。检查任务使用 Node.js 22，执行前后端 ESLint、主题准备及前端构建；只做静态检查所需的依赖安装会跳过安装脚本。发布任务不在 PR 中运行，手动触发时也仅允许上述分支或 v* 标签发布。
Docker Hub 镜像为 `lswl/vertex`，继续使用仓库 Secrets `DOCKER_USERNAME`、`DOCKER_PASSWORD`。分支保留同名标签，版本标签保留原名，另生成 `sha-` 加 12 位提交号的标签；仅 stable 分支更新 latest，不再生成日期标签。同一 ref 的推送发布串行执行，PR 可取消过时运行。
Docker 使用当前检出源码和同次流水线上传的前端 artifact；构建上下文改为仓库根目录，Dockerfile 为 `docker/Dockerfile`。多阶段构建将依赖安装与源码复制分离，构建缓存使用 GitHub Actions cache。`.dockerignore` 采用白名单，排除本地运行数据、数据库和配置，包含前端 `app/static/` 及默认配置模板。
主题准备统一执行 `npm run prepare:themes --prefix webui`；生成失败或产物缺失会使任务失败。CI 版本信息由 `.github/scripts/build-version.cjs` 写入 `VERTEX_BUILD_VERSION`，避免浅克隆及缺少标签影响前端构建。
2026-11-09 工作流优化已通过前后端及辅助脚本 ESLint、actionlint、构建元数据与主题失败处理验证，以及 Docker 官方匹配器的上下文过滤检查。未执行本地生产构建、Docker 构建或远程流水线；镜像构建仍沿用 `lswl/vertex-base:latest`，其 amd64/arm64 平台已通过公开 manifest 确认，原生依赖安装和实际发布需在后续 CI 运行中验证。
