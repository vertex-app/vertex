FROM lswl/vertex-base:latest AS dependencies
WORKDIR /app/vertex

COPY package.json package-lock.json ./
# npm 8 supports lockfile v3 while remaining compatible with Node.js 14.
RUN apk add --no-cache gcc g++ python3 cmake make npm libc-dev && \
  npm install --global npm@8.19.4 --no-audit --no-fund && \
  node --version && npm --version && \
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --omit=dev --no-audit --no-fund

FROM lswl/vertex-base:latest
LABEL maintainer="lswl.in"

ENV TZ=Asia/Shanghai
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
  ln -s /app/localtime /etc/localtime && \
  ln -s /usr/bin/chromium-browser /usr/bin/chromium && \
  chmod +x /usr/bin/chromium && \
  echo 'bind 127.0.0.1' >> /app/redis.conf && \
  echo 'daemonize yes' >> /app/redis.conf && \
  useradd -d /app/vertex -s /bin/sh vt && \
  chown -R vt /vertex && \
  chmod +x /vertex

EXPOSE 3000
CMD ["bash", "/app/vertex/docker/start.sh"]
