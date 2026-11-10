FROM lswl/vertex-base:26 AS runtime

# 历史 :26 镜像通过 apk nodejs 安装的是 Node 24；统一替换为 26.x。
# 构建与最终运行共用这一层，避免原生模块构建时和运行时版本不一致。
RUN node --version && \
  if apk info -e nodejs > /dev/null 2>&1; then apk del nodejs npm; fi && \
  apk add --no-cache 'nodejs-current~26' npm && \
  if apk info -e redis > /dev/null 2>&1; then apk del redis; fi && \
  node --version && npm --version && \
  node -e "require('node:assert/strict').equal(process.versions.node.split('.')[0], '26', 'Expected Node.js 26')"

FROM runtime AS dependencies
WORKDIR /app/vertex

COPY package.json package-lock.json ./
RUN apk add --no-cache build-base python3 cmake linux-headers && \
  node --version && npm --version && \
  PUPPETEER_SKIP_DOWNLOAD=true PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --omit=dev --no-audit --no-fund

FROM runtime
LABEL maintainer="lswl.in"

ENV TZ=Asia/Shanghai \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /app/vertex

COPY --from=dependencies /app/vertex/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY app ./app
COPY docker/start.sh ./docker/start.sh

RUN mkdir /vertex && \
  ln -s /vertex/data /app/vertex/app/data && \
  ln -s /vertex/db /app/vertex/app/db && \
  ln -s /vertex/logs /app/vertex/logs && \
  ln -s /vertex/torrents /app/vertex/torrents && \
  mv /app/vertex/app/config /app/vertex/app/config_backup && \
  ln -s /vertex/config /app/vertex/app/config && \
  ln -snf /app/localtime /etc/localtime && \
  if [ ! -x /usr/bin/chromium ]; then ln -s /usr/bin/chromium-browser /usr/bin/chromium; fi && \
  chmod +x /usr/bin/chromium && \
  useradd -d /app/vertex -s /bin/sh vt && \
  chown -R vt /vertex && \
  chmod +x /vertex && \
  node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); if (db.prepare('SELECT 1 AS ok').get().ok !== 1) process.exit(1); db.close();" && \
  ! command -v redis-server

EXPOSE 3000
CMD ["bash", "/app/vertex/docker/start.sh"]
