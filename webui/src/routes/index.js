import Vue from 'vue';
import Router from 'vue-router';

import Login from '@/pages/login/index';
import Index from '@/pages/home/index';
import Home from '@/pages/home/children/home';
import Monitor from '@/pages/home/children/monitor';
import Site from '@/pages/home/children/site';
import SiteData from '@/pages/home/children/site-data';
import SiteMix from '@/pages/home/children/site-mix';
import Setting from '@/pages/home/children/setting';
import About from '@/pages/home/children/about';
import HitAndRun from '@/pages/home/children/hit-and-run';
import Global from '@/pages/home/children/global';
import Point from '@/pages/home/children/point';
import BingeWatching from '@/pages/home/children/binge-watching';
import RaceRule from '@/pages/home/children/race-rule';
import RaceRuleSet from '@/pages/home/children/race-rule-set';
import LinkRule from '@/pages/home/children/link-rule';
import Douban from '@/pages/home/children/douban';
import DoubanWishes from '@/pages/home/children/douban-wishes';
import DoubanHistory from '@/pages/home/children/douban-history';
import Server from '@/pages/home/children/server';
import Client from '@/pages/home/children/client';
import SearchMix from '@/pages/home/children/search-mix';
import TorrentMix from '@/pages/home/children/torrent-mix';
import TorrentHistory from '@/pages/home/children/torrent-history';
import DeleteRule from '@/pages/home/children/delete-rule';
import RssRule from '@/pages/home/children/rss-rule';
import Push from '@/pages/home/children/push';
import Rss from '@/pages/home/children/rss';
import Log from '@/pages/home/children/log';
import Tools from '@/pages/home/children/tools';
import Link from '@/pages/home/children/link';
import BulkLink from '@/pages/home/children/bulk-link';
import NetworkTest from '@/pages/home/children/network-test';
import LoginMTeam from '@/pages/home/children/login-mteam';

import MobileIndex from '@/pages/mobile/index';
import MobileHome from '@/pages/mobile/home';
import MobileSite from '@/pages/mobile/site';
import MobileClient from '@/pages/mobile/client';

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
      path: 'client',
      component: Client,
      meta: {
        title: '下载器'
      }
    }, {
      path: 'delete-rule',
      component: DeleteRule,
      meta: {
        title: '删种规则'
      }
    }, {
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

const siteMix = {
  path: 'site-mix',
  component: SiteMix,
  children: [
    {
      path: 'site-list',
      component: Site,
      meta: {
        title: '站点列表'
      }
    }, {
      path: 'site-data',
      component: SiteData,
      meta: {
        title: '增长记录'
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
        title: '下载器'
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

const tools = {
  path: 'tools',
  component: Tools,
  children: [
    {
      path: 'login-mteam',
      component: LoginMTeam,
      meta: {
        title: 'MTeam 登录'
      }
    }, {
      path: 'network-test',
      component: NetworkTest,
      meta: {
        title: '网络测试'
      }
    }, {
      path: 'link',
      component: Link,
      meta: {
        title: '软链接'
      }
    }, {
      path: 'bulk-link',
      component: BulkLink,
      meta: {
        title: '批量软链接'
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
        title: '通知工具'
      }
    }, {
      path: 'about',
      component: About,
      meta: {
        title: '关于'
      }
    }
  ]
};

const bingeWatching = {
  path: 'binge-watching',
  component: BingeWatching,
  children: [
    {
      path: 'search-mix',
      component: SearchMix,
      meta: {
        title: '聚合搜索'
      }
    }, {
      path: 'race-rule',
      component: RaceRule,
      meta: {
        title: '选种规则'
      }
    }, {
      path: 'race-rule-set',
      component: RaceRuleSet,
      meta: {
        title: '选种规则'
      }
    }, {
      path: 'link-rule',
      component: LinkRule,
      meta: {
        title: '链接规则'
      }
    }, {
      path: 'douban',
      component: Douban,
      meta: {
        title: '豆瓣账号'
      }
    }, {
      path: 'douban-wishes',
      component: DoubanWishes,
      meta: {
        title: '想看列表'
      }
    }, {
      path: 'douban-history',
      component: DoubanHistory,
      meta: {
        title: '任务历史'
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
        }, {
          path: 'log',
          component: Log,
          meta: {
            title: '系统日志'
          }
        },
        _global,
        siteMix,
        point,
        bingeWatching,
        tools
      ]
    }, {
      path: '/mobile',
      component: MobileIndex,
      redirect: '/mobile/home',
      children: [{
        path: 'home',
        component: MobileHome,
        meta: {
          title: '首页'
        }
      }, {
        path: 'site',
        component: MobileSite,
        meta: {
          title: '站点数据'
        }
      }, {
        path: 'client',
        component: MobileClient,
        meta: {
          title: '下载器'
        }
      }]
    }
  ]
});
