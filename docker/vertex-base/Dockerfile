# syntax=docker/dockerfile:1

# 保留维护者的 Alpine 基础系统，由 apk 提供 Node.js 和 npm。
FROM alpine:3.24
LABEL maintainer="lswl.in"

# 验证运行时确为 Node.js 26，避免基础镜像标签与实际版本不符。
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
      nodejs \
      npm \
      tzdata \
      ca-certificates \
      fontconfig && \
      rm -rf /var/cache/* && \
      mkdir /var/cache/apk && \
    node -e 'if (process.versions.node.split(".")[0] !== "26") process.exit(1)' && \
    node --version && \
    npm --version

# 沿用旧基础镜像项目中的字体配置，构建上下文需包含原 src/local.conf。
COPY src/local.conf /etc/fonts/local.conf
RUN fc-cache -f
