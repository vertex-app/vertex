import Vue from 'vue';
import Router from 'vue-router';

import Login from '@/pages/login/index';
import Index from '@/pages/home/index';
import Home from '@/pages/home/children/home';
import Monitor from '@/pages/home/children/monitor';
import Site from '@/pages/home/children/site';
import SiteMix from '@/pages/home/children/site-mix';
import Setting from '@/pages/home/children/setting';
import HitAndRun from '@/pages/home/children/hit-and-run';
import Global from '@/pages/home/children/global';
import Point from '@/pages/home/children/point';
import BingeWatching from '@/pages/home/children/binge-watching';
import AutoRace from '@/pages/home/children/auto-race';
import Server from '@/pages/home/children/server';
import Client from '@/pages/home/children/client';
import SearchMix from '@/pages/home/children/search-mix';
import Torrent from '@/pages/home/children/torrent';
import TorrentMix from '@/pages/home/children/torrent-mix';
import TorrentHistory from '@/pages/home/children/torrent-history';
import DeleteRule from '@/pages/home/children/delete-rule';
import RssRule from '@/pages/home/children/rss-rule';
import Push from '@/pages/home/children/push';
import Rss from '@/pages/home/children/rss';
import Log from '@/pages/home/children/log';

Vue.use(Router);

const originalPush = Router.prototype.push;
Router.prototype.push = function goto (location) {
  return originalPush.call(this, location).catch(err => err);
};

const hitAndRun = {
  path: 'hit-and-run',
  component: HitAndRun,
  meta: {
    title: '刷流工具'
  },
  children: [
    {
      path: 'rss',
      component: Rss,
      meta: {
        title: 'Rss'
      }
    }, {
      path: 'rss-rule',
      component: RssRule,
      meta: {
        title: 'Rss 规则'
      }
    }, {
      path: 'delete-rule',
      component: DeleteRule,
      meta: {
        title: '删种规则'
      }
    }
  ]
};

const siteMix = {
  path: 'site-mix',
  component: SiteMix,
  children: [
    {
      path: 'site-database',
      component: Site,
      meta: {
        title: '站点数据'
      }
    }, {
      path: 'search-mix',
      component: SearchMix,
      meta: {
        title: '聚合搜索'
      }
    }
  ]
};

const point = {
  path: 'point',
  component: Point,
  children: [
    {
      path: 'client',
      component: Client,
      meta: {
        title: '客户端'
      }
    }, {
      path: 'server',
      component: Server,
      meta: {
        title: '服务器'
      }
    }
  ]
};

const _global = {
  path: 'global',
  component: Global,
  children: [
    {
      path: 'setting',
      component: Setting,
      meta: {
        title: '全局设置'
      }
    }, {
      path: 'push',
      component: Push,
      meta: {
        title: '推送工具'
      }
    }, {
      path: 'log',
      component: Log,
      meta: {
        title: '日志'
      }
    }
  ]
};

const torrent = {
  path: 'torrent',
  component: Torrent,
  meta: {
    title: '种子聚合'
  },
  children: [
    {
      path: 'torrent-mix',
      component: TorrentMix,
      meta: {
        title: '种子聚合'
      }
    }, {
      path: 'torrent-history',
      component: TorrentHistory,
      meta: {
        title: '种子历史'
      }
    }
  ]
};

const bingeWatching = {
  path: 'binge-watching',
  component: BingeWatching,
  children: [
    {
      path: 'auto-race',
      component: AutoRace,
      meta: {
        title: '自动追剧'
      }
    }, {
      path: 'auto-race',
      component: AutoRace,
      meta: {
        title: '自动追剧'
      }
    }
  ]
};

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: '/home'
    }, {
      path: '/login',
      component: Login,
      meta: {
        title: '登录'
      }
    }, {
      path: '/',
      component: Index,
      children: [
        {
          path: 'home',
          component: Home,
          meta: {
            title: '主页'
          }
        },
        hitAndRun,
        {
          path: 'monitor',
          component: Monitor,
          meta: {
            title: '监控信息'
          }
        },
        _global,
        siteMix,
        point,
        bingeWatching,
        torrent
      ]
    }
  ]
});
