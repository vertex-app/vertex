FROM lswl/vertex-base:26 AS dependencies
WORKDIR /app/vertex

COPY package.json package-lock.json ./
RUN apk add --no-cache build-base python3 cmake linux-headers && \
  if ! command -v npm > /dev/null; then apk add --no-cache npm; fi && \
  node -e 'if (process.versions.node.split(".")[0] !== "26") process.exit(1)' && \
  node --version && npm --version && \
  PUPPETEER_SKIP_DOWNLOAD=true PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --omit=dev --no-audit --no-fund

FROM lswl/vertex-base:26
LABEL maintainer="lswl.in"

ENV TZ=Asia/Shanghai \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /app/vertex

COPY --from=dependencies /app/vertex/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY app ./app
COPY docker/start.sh ./docker/start.sh

RUN if apk info -e redis > /dev/null 2>&1; then apk del redis; fi && \
  mkdir /vertex && \
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
