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
