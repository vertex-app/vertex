# 后端依赖升级记录

日期：2026-11-10。运行环境：Node.js 26.13.0、npm 11.20.0。

## 升级范围

检查根目录 package.json 的生产依赖，更新包版本与锁文件，并刷新版本范围内的传递依赖。前端依赖未修改。

| 依赖 | 升级前实际版本 | 升级后实际版本 |
| --- | --- | --- |
| bencode | 2.0.2 | 4.0.1 |
| express | 4.17.2 | 4.22.3 |
| express-http-proxy | 1.6.3 | 2.1.2 |
| express-session | 1.17.2 | 1.19.0 |
| js-yaml | 4.1.0 | 5.5.0 |
| jsdom | 20.0.3 | 31.0.0 |
| log4js | 6.3.0 | 6.9.1 |
| matrix-org-irc | 1.2.1 | 3.1.0 |
| moment | 2.29.1 | 2.31.0 |
| node-cron | 2.0.3 | 4.6.0 |
| ssh2 | 1.6.0 | 1.17.0 |
| tar | 6.1.11 | 7.5.22 |
| xml2js | 0.4.23 | 0.6.2 |

- request 2.88.2 改为 @cypress/request 4.0.1，保留回调、JSON、表单、文件上传、代理、Cookie、超时和原始响应接口。上游说明见 [Cypress request](https://github.com/cypress-io/request)。
- connect-multiparty 2.2.0 改为 multer 2.5.0。仅在通过认证的备份恢复路由处理上传；临时目录权限为 700，响应结束、连接关闭或解析失败后清理文件。
- 删除没有实际调用的直接依赖 got、webdav、form-data；HTTP 库仍按自身声明安装其所需的新版 form-data。
- 删除 uuid 直接依赖，现有 util.uuid.v4 调用通过 Node.js crypto.randomUUID 实现。
- better-sqlite3、Puppeteer 及其插件等已为当前版本的依赖继续保留。
- 开发依赖刷新兼容范围内的版本，包括 eslint-plugin-import 2.32.0；未迁移 ESLint 主版本和配置格式。

## 兼容调整

- bencode 4 只提供 ESM 导出，通过 app/libs/bencode.js 动态加载；其字节串返回 Uint8Array，三条种子下载路径显式转换 Buffer 后按 UTF-8 解码名称。测试确认原始文件字节和 info hash 不变。
- node-cron 4 的任务保存在注册表中，删除或重载任务时改用 destroy，避免只 stop 后残留注册项。迁移与生命周期依据：[迁移说明](https://www.nodecron.com/migrating-from-v3.html)、[API](https://www.nodecron.com/api-reference.html)。
- 新版 IRC 使用 utf-8-validate 6；其安装脚本在本机触发编译并因缺少 g++ 失败。该包官方提供 JavaScript 回退，因此禁用该脚本；cpu-features 为 SSH 可选加速模块，同样禁用安装脚本。无需为它们安装系统编译器。生产依赖干净安装、IRC 初始化和 SSH 握手均验证通过。
- Express 继续使用当前 4.x 的最新版。5.x 涉及路由匹配、错误处理等行为变化，另行迁移时需要连同 express-ws 集成验证，参见 [Express 5 迁移说明](https://expressjs.com/en/guide/migrating-5/)。更新后的 npm outdated --omit=dev 只报告 Express 存在 5.x 主版本。

## 验证与剩余事项

- 完整 32 项自动测试通过，其中新增 8 项覆盖 HTTP 请求、上传、反向代理、XML、备份恢复、三条种子下载路径和定时任务释放。
- 后端与测试 ESLint 通过。
- 临时目录 npm ci --omit=dev 成功；全部 22 个生产直接依赖可加载，SQLite 实际查询、IRC 禁用自动连接初始化、Puppeteer + stealth 启动系统 Chrome 并读取中文页面通过。
- 开发后端重启后监听 4000，前端 8081 代理认证接口均返回预期 401；携带浏览器 Accept 请求头的前端登录页返回 200。内存会话重置，需要重新登录。
- npm audit --omit=dev 从 38 项（严重 4、高危 16、中危 8、低危 10）降至 4 项低危，中危及以上为 0。
- 剩余低危为 deepmerge 4.3.1 及 Puppeteer extra/stealth 的传播告警。查询时 deepmerge 最新版仍为 4.3.1；npm 建议的处理涉及旧版插件，未自动降级。问题见 [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)。
- crypto-js 4.2.0 已是最新版本，但安装时上游提示停止维护。当前 CookieCloud 依赖其加密格式，继续保留；后续替换需通过真实兼容样本验证。
- 本次未构建 Docker 镜像；Alpine amd64/arm64 的实际安装和运行仍待 CI 验证。未提交或推送。

## 首次发布的基础镜像版本问题

2026-11-10，newnode 提交 49b216e 的 GitHub 检查任务通过，镜像发布失败于 Node 主版本断言；npm ci 尚未开始。用户提供的日志中 apk 安装成功后没有 Node/npm 版本输出，因为旧断言使用静默的 process.exit(1)。

已发布 lswl/vertex-base:26 的两个架构构建历史均使用 apk nodejs。Alpine 3.24 官方包索引显示 nodejs 为 24.22.1-r1，26.x 对应 community 仓库的 nodejs-current 26.12.1-r0；镜像标签不能证明实际运行时版本。

本地修复让应用 Dockerfile 创建共享 runtime 阶段，删除旧 nodejs/npm 后安装 nodejs-current~26 和 npm，再同时供 dependencies 和最终阶段继承；基础镜像 Dockerfile 也改用同一个包约束。这样能够使用当前已发布的基础镜像，且构建与运行不会分别使用 Node 26 和 Node 24。保留版本输出，并改用会显示实际与预期主版本的断言。

核实 x86_64/aarch64 两种架构均提供该 26.x 软件包，且它声明提供 nodejs、满足 npm 依赖；两个 Dockerfile 的 RUN shell 语法和版本断言检查通过。未执行 Docker 构建，因此尚不能将实际双架构构建标记为通过。遵照用户要求，修复保留为本地未提交改动，不推送新 commit。

参考：[Alpine 3.24 Node current 包](https://pkgs.alpinelinux.org/packages?branch=v3.24&name=nodejs-current)、[npm 依赖](https://pkgs.alpinelinux.org/package/v3.24/community/x86_64/npm)。

## 更新基础镜像后的本地构建验证

2026-11-10，维护者更新 vertex-base 并授权本地构建后，拉取的新基础镜像索引摘要为 sha256:b31003b46a53a3d8c7a953984ed1a90a7485bdcdb016afaae23587be772e41d6，实际运行时为 Node 26.12.1/npm 11.12.1，符合 package.json 的主版本范围。

重新生成主题与前端生产产物后，执行以下命令成功：

```sh
docker build --pull --progress=plain --platform linux/amd64 \
  -t lswl/vertex:newnode-local -f docker/Dockerfile .
```

构建完成生产依赖安装及最终阶段的 SQLite 实际加载校验，并确认 Redis 已移除。另以 vt 普通用户（UID 1000）运行禁用网络、不挂载业务目录的临时容器，SQLite 中文读写、bencode 中文解码、Puppeteer extra/stealth 启动系统 Chromium 并读取中文页面全部通过。临时容器自动删除，本地镜像保留。

本次仅验证 linux/amd64；arm64 仍待构建。构建仍有已知的旧传递依赖及 crypto-js 弃用提示，未影响成功。日志位于 /tmp/vertex-local-docker-build.log 和 /tmp/vertex-local-frontend-build.log。未提交、未推送代码或镜像。
