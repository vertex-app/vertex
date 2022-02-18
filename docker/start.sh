#! /bin/bash

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

if [ ! -d '/vertex/data/site' ]; then
  mkdir /vertex/data/site
else
  echo '/vertex/data/site exists, continue'
fi

if [ ! -d '/vertex/data/setting' ]; then
  mkdir /vertex/data/setting
else
  echo '/vertex/data/setting exists, continue'
fi

if [ ! -d '/vertex/db' ]; then
  mkdir /vertex/db
else
  echo '/vertex/db exists, continue'
fi

if [ ! -f '/vertex/db/sql.db' ]; then
  wget "https://minio.lswl.in/share/sql.db" -O /vertex/db/sql.db
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
  cp /root/vertex/app/config_backup/* /vertex/config/
  cp /vertex/config/config.example.yaml /vertex/config/config.yaml
else
  echo '/vertex/config/config.yaml exists, continue'
fi

if [ ! -f '/vertex/data/setting.json' ]; then
  cp /root/vertex/app/config_backup/setting.json /vertex/data/
else
  echo '/vertex/data/setting.json exists, continue'
fi

if [ ! -f '/vertex/data/setting/torrent-history-settign.json' ]; then
  cp /root/vertex/app/config_backup/torrent-history-settign.json /vertex/data/setting/
else
  echo '/vertex/data/setting/torrent-history-settign.json exists, continue'
fi

cd ~/vertex
export PORT=3000
node app/app.js