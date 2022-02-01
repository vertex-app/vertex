FROM alpine:3.14
RUN \
  apk add redis bash git nodejs npm python3 make gcc libc-dev g++ tzdata && \
  git clone https://gitlab.lswl.in/lswl/vertex.git ~/vertex && \
  cd /root/vertex && \
  git checkout BRANCH && \
  rm .git webui -rf && \
  npm i --save && \
  mkdir /vertex && \
  ln -s /vertex/data /root/vertex/app/data && \
  ln -s /vertex/db /root/vertex/app/db && \
  ln -s /vertex/logs /root/vertex/logs && \
  mv /root/vertex/app/config /root/vertex/app/config_backup && \
  ln -s /vertex/config /root/vertex/app/config && \
  apk del gcc g++ && \
  echo 'daemonize yes' >> /etc/redis.conf
COPY src/static /root/vertex/app/static
ENV TZ=Asia/Shanghai
CMD \
  cp /usr/share/zoneinfo/$TZ /etc/localtime && \
  /usr/bin/redis-server /etc/redis.conf && \
  bash ~/vertex/docker/start.sh