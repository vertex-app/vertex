<div align="center">
  <img src="https://wiki.vertex.icu/logo-vertex.png" width="144"/>
</div>
<div align="center">
  <h1 align="center">Vertex</h1>
  <h3 align="center">适用于 PT 玩家的追剧刷流一体化综合管理工具</h3>
  <p align="center">
    <a href="https://github.com/vertex-app/vertex"><img src="https://img.shields.io/github/stars/vertex-app/vertex?style=for-the-badge" /></a>
    <a href="https://github.com/vertex-app/vertex"><img src="https://img.shields.io/github/last-commit/vertex-app/vertex?style=for-the-badge" /></a>
    <a href="https://github.com/vertex-app/vertex"><img src="https://img.shields.io/github/license/vertex-app/vertex?style=for-the-badge"></a>
    <a href="https://github.com/vertex-app/vertex"><img src="https://img.shields.io/github/languages/top/vertex-app/vertex?style=for-the-badge"></a>
    <a href="https://hub.docker.com/r/lswl/vertex"><img src="https://img.shields.io/docker/pulls/lswl/vertex?style=for-the-badge" /></a>
    <a href="https://hub.docker.com/r/lswl/vertex"><img src="https://img.shields.io/docker/image-size/lswl/vertex?style=for-the-badge" /></a>
    <a href="https://hub.docker.com/r/lswl/vertex"><img src="https://img.shields.io/badge/platform-amd64/arm64-pink?style=for-the-badge" /></a>
  </p>
</div>
<hr/>
<p align="center">

⚡ 刷流：提供 RSS 任务、种子监控、自动删种、数据统计 全自动流程配置，提供多下载器 负载均衡 及 自定义分流 功能，可根据 自定义规则，将不同的种子按需求分流至不同分类或下载器。

🌌 追剧：通过在 豆瓣点击想看按钮 或 Vertex 添加想看项目，自动在 PT 站点 内搜索资源，并推送至 qBittorrent 或 Transmission，在种子下载完毕之后 自动 根据指定的 链接规则，将影视文件链接为 可被 Plex / Emby 正常识别的文件。如果是仍在更新的电视剧或暂未上映的电影，则会自动 启动追更模式，定时在站内搜索资源并下载。

⭐ 超级模式：追剧任务更支持 类 RSS 的 超级模式，在种子发布之后的 几分钟内 就可以将正在追剧的种子发送至下载器，下载完成之后自动执行链接操作。

⛱  链接：除了追剧任务添加的种子之外，同时支持 监控 下载器内 指定分类或保存路径 的种子文件，当文件完成时，会 自动执行 链接操作，生成 可被 Plex / Emby 正常识别的链接文件。除此之外，更支持选择 单个 或 批量选择 种子根据链接规则执行连接操作。

⏱ 定时任务：可以编写自定义的 JavaScript 脚本，利用 Vertex 所有的内置资源（下载器信息，站点信息，内置方法）等，达成各类自定义类似 全自动限速种子、监控站点 HR 等功能。

🌈 站点：提供站点的上传下载数据统计及历史信息。
</p>
<hr/>

### Contribute
#### 开发环境
Node.js v14.17.0  
npm 6.14.13

#### 拉取代码
Fork 本仓库后拉取到本地

#### 安装依赖
``` bash
cd vertex
npm i --save-dev
cd webui
npm i --save-dev --legacy-peer-deps
```

#### 目录结构
```
.
├── app                   # 后端
│   ├── app.js            # 程序入口
│   ├── common            # 基本类
│   ├── config            # 配置文件
│   ├── controller        # Controller
│   ├── data              # 持久数据存放目录 （具体生成逻辑参考 docker/start.sh）
│   ├── libs              # 工具文件夹
│   ├── model             # Model
│   ├── routes            # 路由
│   └── script            # 脚本文件夹 （已弃用）
├── docker                # docker 相关
│   ├── Dockerfile
│   └── start.sh
├── LICENSE
├── nodemon.json
├── package.json
├── package-lock.json
├── README.md
├── webhook               # Webhook 资源相关
│   └── EmbySXPackage
└── webui                 # 前端
    ├── babel.config.js
    ├── cyber.js
    ├── dark.js
    ├── light.js
    ├── package.json
    ├── package-lock.json
    ├── public
    │   ├── assets
    │   └── index.html
    ├── src
    │   ├── api           # 请求 api
    │   ├── App.vue       #
    │   ├── main.js       # 入口
    │   ├── pages         # 页面 .vue
    │   ├── routes        # 路由
    │   ├── style         # 主题相关
    │   └── util          # 工具类
    └── vue.config.js
```

#### 启动
``` bash
# 安装 nodemon
npm i -g nodemon

# 终端 1 启动后端
cd vertex
npm run app

# 终端 2 启动 vue-server
cd webui
npm run serve
```

### 交流群组
QQ: 刷流 852643057 / 追剧 926921776

<hr/>

### Wiki
<p><a href="https://wiki.vertex.icu">Wiki</a></p>
<hr/>