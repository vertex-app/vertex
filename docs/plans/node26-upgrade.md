# Vertex 升级至 Node.js 26 方案

编写日期：2026-11-09。基础系统：Alpine。

## 实施记录（2026-11-09）

两套方案已一并实施：Node.js 26.13.0/npm 11.20.0、SQLite 13.0.3、Puppeteer 25.16.0、puppeteer-extra 3.3.6/stealth 2.11.2，使用 `lswl/vertex-base:26`；Redis 客户端、会话 Store 和分布式锁已替换为自实现的进程内模块，Redis 启动配置及应用依赖已移除。

当前本机前后端已用 Node 26 重启，后端 4000、前端 8081，项目 Redis 已停止。19 项自动测试、真实路由登录/注销、原数据库模板读取、隔离生产依赖安装、真实浏览器上下文隔离、主题生成及前端生产构建已通过。本次未执行 Docker 构建或推送，Alpine 双架构容器仍需 CI 验证。

实施调整：SQLite 13 包已包含 Linux glibc/musl 双架构预编译模块，安装策略不再强制重编译；最终镜像的 RUN 校验会实际加载 SQLite。主题生成不再扫描输出目录。Vue CLI 保留现有架构并升级补丁版本，IPC 9.2.10 的 engines 仅声明至 Node 25，存在已知告警，Node 26 下的开发和构建均已实测通过。

维护者已自行找回原字体配置并发布基础镜像 `:26`，原 src/local.conf 未复制到当前仓库；不生成替代配置。当前基础镜像若仍包含 Redis，应用构建阶段会移除该包；已同步从基础镜像源文件删除 redis，后续可重新发布更干净的基础层。

下文保留原设计及验收要求作为记录；涉及“尚未实施”“尚需提供字体文件”或旧基础镜像的叙述为设计时状态，以本节及 AGENTS.md 当前状态为准。

## 1. 范围与目标

- 统一开发环境、前端构建、CI、Docker 依赖构建阶段和运行阶段至 Node.js **26.13.0**。
- 使用官方 `node:26.13.0-alpine3.24` 镜像及其附带的 npm，目标平台为 `linux/amd64`、`linux/arm64`。
- 按核对时的官方版本清单，Node.js 26.13.0 为最新正式 LTS，附带 npm 11.20.0；Node.js 27 为 Alpha，本方案不使用预发布版本。
- 本次交付升级方案及独立的 `vertex-base` Dockerfile。应用、依赖和工作流的实际升级是后续工作，本文不代表已完成升级。
- 不新增业务功能，不批量跨主版本更新无关依赖，不将 CommonJS 全面改写为 ESM。

## 2. 当前状态及关键约束

维护者提供的旧 vertex-base Dockerfile 使用 `alpine:3.13`，通过 apk 安装 Node.js、Chromium、Redis、Xvfb、shadow、Bash、时区及字体渲染依赖，并将 `src/local.conf` 复制到 `/etc/fonts/local.conf`。

| 项目 | 当前状态 | 目标 |
| --- | --- | --- |
| 生产基础镜像 | `lswl/vertex-base:latest`，旧 Alpine、Node.js 14 | 独立版本的 Node.js 26 / Alpine 3.24 镜像 |
| Docker npm | 临时固定 npm 8.19.4 | 使用官方 Node 镜像附带的 npm |
| CI 检查任务 | Node.js 22 | 与生产统一至 Node.js 26.13.0 |
| 本地开发记录 | 临时 Node.js 16 运行时 | 使用项目统一版本文件 |
| SQLite 驱动 | `better-sqlite3 ~7.5.3` | 验证支持 Node.js 26 的版本 |
| 浏览器接口 | Puppeteer 13、puppeteer-extra、stealth 插件 | 验证可协同运行的新版本组合 |
| 前端 | Vue CLI 5、Vue 3、Less 主题生成 | 优先保留现有构建链并完成兼容验证 |

Alpine 使用 musl。原生模块必须在对应目标架构、相同 Node 与 Alpine 环境中安装；不能复制本机、Debian 或其他架构的 `node_modules`。`better-sqlite3` 若无适用预编译包，应在依赖阶段源码编译并实际加载验证。

## 3. vertex-base 交付与接口约定

Dockerfile：[`docker/vertex-base/Dockerfile`](../../docker/vertex-base/Dockerfile)。已按维护者提供的旧文件更新，保留运行依赖和 `COPY src/local.conf /etc/fonts/local.conf`，不额外承担应用初始化。

与旧文件的差异：

- FROM 使用 `node:26.13.0-alpine3.24`，基础系统仍为 Alpine，Node.js/npm 由官方镜像提供，不再执行 `apk add nodejs npm`。
- 保留 Xvfb、libstdc++、Chromium、Harfbuzz、NSS、FreeType、FreeFont、Emoji 字体、shadow、Redis、Bash 和 tzdata。
- 原 `ttf-freefont` 使用新版 Alpine 实际包名 `font-freefont`。
- 显式安装 ca-certificates 和 fontconfig，复制旧字体配置后执行 `fc-cache -f`。
- `apk --no-cache` 已避免保存索引缓存，删除旧文件中重复的缓存清理操作。
- 没有新增 tini、ENTRYPOINT、Redis 配置、时区软链接或应用目录初始化，沿用应用镜像和启动脚本的职责。

**构建前准备字体文件：** 当前仓库未包含旧文件 `src/local.conf`。请将旧 vertex-base 项目中的原文件放到 `docker/vertex-base/src/local.conf`，或在原基础镜像项目中使用新版 Dockerfile 并保留原 `src/local.conf`。本次未臆造字体规则；该文件未就位时 Docker 构建会在 COPY 阶段失败。

路径及行为约定：

| 接口 | 责任归属 |
| --- | --- |
| Chromium、Redis、Xvfb、Bash、shadow 工具 | 基础镜像通过 apk 提供 |
| `/etc/fonts/local.conf` | 从维护者原 src/local.conf 复制 |
| `/usr/bin/chromium` 兼容路径 | 应用 Dockerfile 按实际路径检查后创建，避免覆盖已有程序 |
| `/app/redis.conf` | 应用 Dockerfile 继续建立，启动脚本读取 |
| `/app/localtime`、`/etc/localtime` | 应用 Dockerfile 和启动脚本继续处理 |
| DISPLAY、Redis/Xvfb 启动 | 应用启动脚本继续管理 |
| vt 用户、/vertex、持久化配置和目录 | 应用镜像及启动脚本继续管理 |

2026-11-09 已核对 Alpine 3.24 main/community 索引中的包名和双架构可用性；这是来源核对，不能替代镜像构建与运行验证。apk 包随安全更新变化，发布后记录镜像 digest。

Redis 服务端将随基础系统升级，需验证现有 redis 3.x 客户端、connect-redis 6 和 redlock 4 的连接、会话及锁行为；如有兼容阻碍，再单独选择服务端或客户端调整方案，不混用旧 Alpine 软件仓库。

## 4. 由维护者构建与发布基础镜像

先准备上节所述的 `src/local.conf`，再执行构建。以下命令供维护者在自己的构建环境执行，本次未运行。需要已有可工作的 Docker Buildx；多架构构建需要具备相应原生节点或模拟执行能力。

先构建当前机器架构的本地测试镜像：

```bash
docker buildx build --pull --load \
  --tag lswl/vertex-base:node26.13.0-alpine3.24 \
  docker/vertex-base
```

在原生架构上检查版本和路径，可使用官方镜像自带的普通 node 用户：

```bash
docker run --rm --user node lswl/vertex-base:node26.13.0-alpine3.24 \
  sh -ec 'node --version; npm --version; chromium-browser --version; redis-server --version; command -v Xvfb; test -s /etc/fonts/local.conf; fc-match sans-serif'
```

检查 Chromium 无头启动：

```bash
docker run --rm --user node --shm-size=256m \
  lswl/vertex-base:node26.13.0-alpine3.24 \
  chromium-browser --headless --no-sandbox --disable-dev-shm-usage \
  --dump-dom 'data:text/html,<title>Vertex</title><body>browser-ok</body>'
```

`--no-sandbox` 与应用现有浏览器启动行为保持一致；该检查仅用于本地自包含页面。还需在应用集成阶段验证现有 Xvfb 有头模式。

验证后发布独立的双架构标签：

```bash
docker buildx build --pull \
  --platform linux/amd64,linux/arm64 \
  --tag lswl/vertex-base:node26.13.0-alpine3.24 \
  --push docker/vertex-base
```

使用 `docker buildx imagetools inspect lswl/vertex-base:node26.13.0-alpine3.24` 确认两种架构，并记录镜像索引 digest。后续应用的两个构建阶段固定使用同一标签或同一索引 digest。

先保留独立标签，**不要直接覆盖 vertex-base:latest**。当前应用依赖和 Dockerfile 尚未适配，新镜像不能直接替换旧基础镜像。

## 5. 应用升级实施顺序

### 5.1 统一版本与锁文件

- 新增 `.nvmrc`，内容为 `26.13.0`。
- 前后端 package.json 添加 Node 26、npm 11 的版本要求；运行时和构建工具使用相同版本。
- 在该环境下有选择地调整依赖并更新两份锁文件，审核版本变化。
- 使用干净目录执行 `npm ci` 验证可重现性。不要直接将两份锁文件全部删除后无差别升级。
- 原生模块验收必须执行安装脚本；现有 lint 任务的 `--ignore-scripts` 只适用于静态检查。

### 5.2 SQLite 与浏览器适配

- 优先验证 better-sqlite3 13.0.3，其包声明支持 Node >=22；具体 API、SQLite 行为及双架构包可用性仍需测试，不视为已兼容。
- 使用数据库副本验证查询、写入、事务、完整性及重启后读取，记录实际 SQLite 版本；保留恢复原数据库的途径。
- 联合选择 Puppeteer、puppeteer-extra、stealth 插件版本，并与 Alpine 仓库的 Chromium 实测配对。
- 替换 `app/libs/util.js` 中已经移除的 `page.waitForTimeout()`，检查 Cookie 设置、页面等待、异常关闭和浏览器重启。
- 保留系统 Chromium 和 Xvfb 模式，跳过 Puppeteer 自带浏览器下载；浏览器启动路径明确使用 `/usr/bin/chromium`。
- 若遇到模块导出格式变化，优先局部适配，不扩大为全项目模块系统迁移。

### 5.3 适配应用 Dockerfile

对现有 `docker/Dockerfile` 的后续修改要求：

1. 两个 FROM 同时改用新基础镜像的独立标签或索引 digest。
2. 依赖阶段安装 `build-base python3 cmake linux-headers` 等实际需要的编译工具，不再安装 apk 的 npm/nodejs，也不再固定 npm 8.19.4。
3. 保留 `npm ci --omit=dev --no-audit --no-fund`，执行原生安装脚本；必要时补充构建依赖并记录原因。
4. 基础镜像按旧文件保留运行依赖，不初始化时区及兼容软链接。应用阶段继续建立 `/etc/localtime` 与 `/usr/bin/chromium`，但需改为幂等操作：已存在的有效 Chromium 程序不要覆盖，时区链接使用可重复执行的设置方式。
5. 应用阶段继续建立 `/app/redis.conf`，确认绑定地址、daemonize、持久化和端口策略；新版基础镜像不生成该配置。
6. 保留 vt 用户、/vertex 挂载路径、配置模板和现有启动脚本接口；检查官方基础镜像自带 node 用户与 PUID/PGID 调整的兼容性。
7. 编译工具只保留在 dependencies 阶段。运行阶段保持相同 Node、musl 和目标架构，验证所有 `.node` 文件能实际加载。

上述调整应在依赖适配完成后进行，本文未修改应用 Dockerfile。

### 5.4 前端与 CI

- 优先保留 Vue CLI 5、Vue 3、Ant Design Vue 和现有主题流程，验证 Babel、Webpack、Less、ESLint 及旧传递依赖在 Node 26 下的兼容性。
- Vue CLI 已处于维护模式；如出现无法修复的兼容阻碍，再单独规划 Vite 迁移。
- GitHub Actions 通过 `node-version-file: .nvmrc` 读取版本，保留现有 lint、主题准备、前端构建及 PR 不发布规则。
- 增加 Linux 原生模块加载与后端启动验证；Ubuntu 上的成功不能替代 Alpine/musl 测试。
- 双架构镜像先发布独立测试标签，集成验收后再推广至正式分支及 latest。

## 6. 验收与回退

| 验证项 | 通过条件 |
| --- | --- |
| 基础镜像 | 两种架构均为 Node 26；npm、Chromium、Redis、Xvfb 可用 |
| 原生依赖 | amd64/arm64 的 Alpine 环境均可安装、加载和执行 SQLite 读写 |
| 前端 | ESLint、三套主题和生产构建通过，页面及登录可用 |
| 服务 | Redis 连接、会话、业务查询、RSS 请求与重试正常 |
| 浏览器 | 无头基础检查及 Xvfb 下的应用浏览器流程均通过 |
| 容器 | PUID/PGID、时区、挂载目录、停止与重启行为保持可用 |
| 发布 | 测试标签验证完成后才推广正式标签，保留旧镜像 digest |
| 回退 | 使用旧镜像及升级前数据库副本验证恢复，避免仅回退镜像却继续使用无法确认兼容的数据 |

优先在本地完成安装、原生模块、主题和浏览器验证，再进行少量远端 CI 集成验证。不能将“lint 通过”或“跳过安装脚本的 npm ci 通过”作为运行时升级成功依据。

## 7. 交付状态

- 可选的 Redis 移除路线见 [自实现内存管理替代 Redis](remove-redis.md)。若同时采用该方案，本文的 Redis 保留及验收要求按替代方案调整；应用替代完成后再发布不含 Redis 的基础镜像。
- 已提供方案与基础镜像 Dockerfile，按旧版依赖及字体 COPY 结构保留 Alpine 路线；原 src/local.conf 尚需维护者在构建上下文中提供。
- 本次仅做静态检查和官方来源核对，未运行 Docker 构建、容器或项目生产构建。
- 基础镜像构建、发布及应用实际升级尚待执行；未提交或推送本次文件。

## 8. 参考来源

- [Node.js 官方发布清单](https://nodejs.org/dist/index.json)
- [Node 官方镜像标签及架构](https://raw.githubusercontent.com/docker-library/official-images/master/library/node)
- [Node 26 Alpine 3.24 官方 Dockerfile](https://raw.githubusercontent.com/nodejs/docker-node/main/26/alpine3.24/Dockerfile)
- [Alpine 3.24 官方软件仓库](https://dl-cdn.alpinelinux.org/alpine/v3.24/)
- [better-sqlite3 包元数据](https://registry.npmjs.org/better-sqlite3/latest)
- [Puppeteer 变更记录](https://pptr.dev/CHANGELOG)
- [Vue CLI 维护状态](https://cli.vuejs.org/)
