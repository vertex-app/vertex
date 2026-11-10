# syntax=docker/dockerfile:1

# 保留维护者的 Alpine 基础系统，由 apk 提供 Node.js 和 npm。
FROM alpine:3.24
LABEL maintainer="lswl.in"

# Alpine 3.24 的 nodejs 包为 24.x，26.x 使用 community 的 nodejs-current。
# 约束在 26.x，避免仓库后续更新后静默安装其他主版本。
# ttf-freefont 在新版 Alpine 中使用实际包名 font-freefont。
RUN apk add --no-cache \
      xvfb \
      libstdc++ \
      chromium \
      harfbuzz \
      nss \
      freetype \
      font-freefont \
      font-noto-emoji \
      shadow \
      bash \
      'nodejs-current~26' \
      npm \
      tzdata \
      ca-certificates \
      fontconfig && \
      rm -rf /var/cache/* && \
      mkdir /var/cache/apk && \
    node --version && \
    npm --version && \
    node -e "require('node:assert/strict').equal(process.versions.node.split('.')[0], '26', 'Expected Node.js 26')"

# 沿用旧基础镜像项目中的字体配置，构建上下文需包含原 src/local.conf。
COPY src/local.conf /etc/fonts/local.conf
RUN fc-cache -f
