import Vue from 'vue';
import Router from 'vue-router';

import Login from '@/pages/login/index';
import Index from '@/pages/home/index';
import Home from '@/pages/home/children/home';
import Monitor from '@/pages/home/children/monitor';
import Site from '@/pages/home/children/site';
import Setting from '@/pages/home/children/setting';
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

Vue.use(Router);

const originalPush = Router.prototype.push;
Router.prototype.push = function goto (location) {
  return originalPush.call(this, location).catch(err => err);
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
        }, {
          path: 'monitor',
          component: Monitor,
          meta: {
            title: '监控信息'
          }
        }, {
          path: 'site',
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
        }, {
          path: 'setting',
          component: Setting,
          meta: {
            title: '全局设置'
          }
        }, {
          path: 'server',
          component: Server,
          meta: {
            title: '服务器'
          }
        }, {
          path: 'client',
          component: Client,
          meta: {
            title: '客户端'
          }
        }, {
          path: 'delete-rule',
          component: DeleteRule,
          meta: {
            title: '删种规则'
          }
        }, {
          path: 'rss-rule',
          component: RssRule,
          meta: {
            title: 'Rss 规则'
          }
        }, {
          path: 'push',
          component: Push,
          meta: {
            title: '推送工具'
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
        }, {
          path: 'rss',
          component: Rss,
          meta: {
            title: 'Rss'
          }
        }, {
          path: 'log',
          component: Log,
          meta: {
            title: '日志'
          }
        }
      ]
    }
  ]
});
