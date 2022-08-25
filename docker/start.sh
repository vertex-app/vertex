#! /bin/bash

if [ -d '/tmp/vertex' ]; then
  rm -rf /vertex/*
  mv /tmp/vertex/* /vertex
  rm -rf /tmp/vertex
fi

if [ ! -d '/vertex/data' ]; then
  mkdir /vertex/data/rss -p
  mkdir /vertex/data/client
  mkdir /vertex/data/server
  mkdir /vertex/data/rule/delete -p
  mkdir /vertex/data/rule/rss
  mkdir /vertex/data/push
else
  echo '/vertex/data exists, continue'
fi

if [ ! -d '/vertex/data/rule/race' ]; then
  mkdir /vertex/data/rule/race
else
  echo '/vertex/data/rule/race exists, continue'
fi

if [ ! -d '/vertex/data/script' ]; then
  mkdir /vertex/data/script
else
  echo '/vertex/data/script exists, continue'
fi

if [ ! -d '/vertex/data/watch' ]; then
  mkdir /vertex/data/watch/set -p
else
  echo '/vertex/data/watch exists, continue'
fi

if [ ! -d '/vertex/data/rule/raceSet' ]; then
  mkdir /vertex/data/rule/raceSet
else
  echo '/vertex/data/rule/raceSet exists, continue'
fi

if [ ! -d '/vertex/data/rule/link' ]; then
  mkdir /vertex/data/rule/link
else
  echo '/vertex/data/rule/link exists, continue'
fi

if [ ! -d '/vertex/data/site' ]; then
  mkdir /vertex/data/site
else
  echo '/vertex/data/site exists, continue'
fi

if [ ! -d '/vertex/data/race' ]; then
  mkdir /vertex/data/race
else
  echo '/vertex/data/race exists, continue'
fi

if [ ! -d '/vertex/data/setting' ]; then
  mkdir /vertex/data/setting
else
  echo '/vertex/data/setting exists, continue'
fi

if [ ! -d '/vertex/data/douban' ]; then
  mkdir /vertex/data/douban/set -p
else
  echo '/vertex/data/setting exists, continue'
fi

if [ ! -d '/vertex/db' ]; then
  mkdir /vertex/db
else
  echo '/vertex/db exists, continue'
fi

if [ ! -d '/vertex/torrents' ]; then
  mkdir /vertex/torrents
else
  echo '/vertex/torrents exists, continue'
fi

if [ ! -f '/vertex/db/sql.db' ]; then
  cp /app/vertex/app/config_backup/sql.db /vertex/db/sql.db
else
  echo '/vertex/db/sql.db exists, continue'
fi

if [ ! -d '/vertex/logs' ]; then
  mkdir /vertex/logs
else
  echo '/vertex/logs exists, continue'
fi

if [ ! -f '/vertex/config/config.yaml' ]; then
  mkdir /vertex/config
  cp /app/vertex/app/config_backup/*.yaml /vertex/config/
  cp /vertex/config/config.example.yaml /vertex/config/config.yaml
else
  echo '/vertex/config/config.yaml exists, continue'
fi

if [ ! -f '/vertex/data/setting.json' ]; then
  cp /app/vertex/app/config_backup/setting.json /vertex/data/
else
  echo '/vertex/data/setting.json exists, continue'
fi

if [ ! -f '/vertex/data/bulk-link-history.json' ]; then
  echo '{}' > /vertex/data/bulk-link-history.json
else
  echo '/vertex/data/bulk-link-history.json exists, continue'
fi

if [ -f '/vertex/data/hosts' ]; then
  echo "`cat /vertex/data/hosts`" > /etc/hosts
fi

if [ ! -f '/vertex/data/setting/torrent-history-setting.json' ]; then
  cp /app/vertex/app/config_backup/torrent-history-setting.json /vertex/data/setting/
else
  echo '/vertex/data/setting/torrent-history-setting.json exists, continue'
fi

if [ ! -f '/vertex/data/setting/torrent-mix-setting.json' ]; then
  cp /app/vertex/app/config_backup/torrent-mix-setting.json /vertex/data/setting/
else
  echo '/vertex/data/setting/torrent-mix-setting.json exists, continue'
fi

if [ ! -f '/vertex/data/setting/site-push-setting.json' ]; then
  cp /app/vertex/app/config_backup/site-push-setting.json /vertex/data/setting/
else
  echo '/vertex/data/setting/site-push-setting.json exists, continue'
fi

if [ ! -f '/vertex/data/setting/torrent-push-setting.json' ]; then
  cp /app/vertex/app/config_backup/torrent-push-setting.json /vertex/data/setting/
else
  echo '/vertex/data/setting/torrent-push-setting.json exists, continue'
fi

if [ ! -f '/vertex/data/setting/proxy.json' ]; then
  cp /app/vertex/app/config_backup/proxy.json /vertex/data/setting/
else
  echo '/vertex/data/setting/proxy.json exists, continue'
fi

if [ -f '/tmp/.X99-lock' ]; then
  rm /tmp/.X99-lock
fi

cp /app/vertex/app/config_backup/logger.yaml /vertex/config/logger.yaml

VUID=`[ $PUID ] && echo $PUID || echo 0`
VGID=`[ $PGID ] && echo $PGID || echo 0`
usermod -o -u ${VUID} vt > /dev/null 2>&1 ||:
groupmod -o -g ${VGID} vt > /dev/null 2>&1 ||:
usermod -g ${VGID} vt > /dev/null 2>&1 ||:
chown -R ${VUID}:${VGID} /vertex
export PORT=`[ $PORT ] && echo $PORT || echo 3000`
Xvfb -ac :99 -screen 0 1280x1024x16 &
export DISPLAY=:99
su - vt -p -c 'cd /app/vertex && node app/app.js > /dev/null'