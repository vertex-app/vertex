#! /bin/bash

if [ ! -d '/vertex/data' ]; then
  mkdir /vertex/data/rss -p
  mkdir /vertex/data/client
  mkdir /vertex/data/server
  mkdir /vertex/data/rule/delete -p
  mkdir /vertex/data/rule/rss
  mkdir /vertex/data/telegram/channel -p
  mkdir /vertex/data/telegram/bot
else
  echo '/vertex/data exists, continue'
fi

if [ ! -d '/vertex/db' ]; then
  mkdir /vertex/db
  wget "https://minio.lswl.in/share/sql.db" -O /vertex/db/sql.db
else
  echo '/vertex/db exists, continue'
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

cd ~/vertex
npm run app