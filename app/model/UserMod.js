const otp = require('../libs/otp');

class UserMod {
  login (options) {
    if (options.username !== global.auth.username) {
      throw new Error('用户名错误');
    }
    if (options.password !== global.auth.password) {
      throw new Error('密码错误');
    }
    if (global.auth.otp && !otp.verify(global.auth.otp, options.otpPw)) {
      throw new Error('两步验证错误');
    }
    return options.username;
  };

  get (options) {
    const menu = [
      {
        title: '首页',
        path: '/index',
        icon: ['fas', 'house-user']
      }, {
        title: '数据监控',
        path: '/metric',
        icon: ['fas', 'chart-line'],
        sub: [{
          title: '站点',
          path: '/metric/site',
          icon: ['fas', 'location']
        }, {
          title: '服务器',
          path: '/metric/server',
          icon: ['fas', 'server']
        }, {
          title: '下载器',
          path: '/metric/downloader',
          icon: ['fas', 'download']
        }]
      }, {
        title: '基础组件',
        path: '/base',
        icon: ['fas', 'circle-nodes'],
        sub: [{
          title: '站点',
          path: '/base/site',
          icon: ['fas', 'location']
        }, {
          title: '服务器',
          path: '/base/server',
          icon: ['fas', 'server']
        }, {
          title: '下载器',
          path: '/base/downloader',
          icon: ['fas', 'download']
        }, {
          title: '通知工具',
          path: '/base/notification',
          icon: ['fas', 'bell']
        }]
      }, {
        title: '规则组件',
        path: '/rule',
        icon: ['fas', 'code'],
        sub: [{
          title: '删种规则',
          path: '/rule/delete',
          icon: ['fas', 'ban']
        }, {
          title: 'RSS 规则',
          path: '/rule/rss',
          icon: ['fas', 'square-rss']
        }, {
          title: '选种规则',
          path: '/rule/select',
          icon: ['fas', 'square-check']
        }, {
          title: '链接规则',
          path: '/rule/link',
          icon: ['fas', 'link']
        }]
      }, {
        title: '任务配置',
        path: '/task',
        icon: ['fas', 'list-check'],
        sub: [{
          title: 'RSS 任务',
          path: '/task/rss',
          icon: ['fas', 'rss']
        }, {
          title: '订阅任务',
          path: '/task/subscribe',
          icon: ['fas', 'calendar-check']
        }, {
          title: '监控分类',
          path: '/task/watchCategory',
          icon: ['fas', 'video']
        }, {
          title: '定时脚本',
          path: '/task/script',
          icon: ['fas', 'clock']
        }, {
          title: '链接文件',
          path: '/task/link',
          icon: ['fas', 'link']
        }, {
          title: '批量链接',
          path: '/task/bulkLink',
          icon: ['fas', 'link']
        }]
      }, {
        title: '影视订阅',
        path: '/subscribe',
        icon: ['fas', 'tv'],
        sub: [{
          title: '订阅列表',
          path: '/subscribe/list',
          icon: ['fas', 'square-check']
        }, {
          title: '影视搜索',
          path: '/subscribe/search',
          icon: ['fas', 'magnifying-glass']
        }, {
          title: '手动添加',
          path: '/subscribe/add',
          icon: ['fas', 'plus']
        }]
      }, {
        title: '聚合操作',
        path: '/mix',
        icon: ['fas', 'share-nodes'],
        sub: [{
          title: '种子搜索',
          path: '/mix/search',
          icon: ['fab', 'searchengin']
        }, {
          title: '种子聚合',
          path: '/mix/downloader',
          icon: ['fas', 'cloud']
        }]
      }, {
        title: '任务历史',
        path: '/history',
        icon: ['fas', 'clock-rotate-left'],
        sub: [{
          title: 'RSS 历史',
          path: '/history/rss',
          icon: ['fas', 'rss']
        }, {
          title: '订阅历史',
          path: '/history/subscribe',
          icon: ['fas', 'calendar-check']
        }, {
          title: '监控分类历史',
          path: '/history/watchCategory',
          icon: ['fas', 'video']
        }]
      }, {
        title: '常用工具',
        path: '/tool',
        icon: ['fas', 'toolbox'],
        sub: [{
          title: '蜜柑番剧历史',
          path: '/tool/mikanHistory',
          icon: ['fas', 'clock-rotate-left']
        }, {
          title: '网络测试',
          path: '/tool/networkTest',
          icon: ['fas', 'square-check']
        }, {
          title: '修改 HOSTS',
          path: '/tool/hosts',
          icon: ['fas', 'route']
        }, {
          title: 'HTTP 代理',
          path: '/tool/proxy',
          icon: ['fas', 'globe']
        }, {
          title: '路径生成器',
          path: '/tool/pathGenerator',
          icon: ['fas', 'terminal']
        }, {
          title: '下载器日志',
          path: '/tool/clientLog',
          icon: ['fas', 'note-sticky']
        }]
      }, {
        title: '任务引导',
        path: '/guide',
        icon: ['fas', 'route'],
        sub: [{
          title: 'RSS 引导',
          path: '/guide/rss',
          icon: ['fas', 'rss']
        }, {
          title: '订阅引导',
          path: '/guide/subscribe',
          icon: ['fas', 'calendar-check']
        }]
      }, {
        title: '系统设置',
        path: '/setting',
        icon: ['fas', 'gears'],
        sub: [{
          title: '基础设置',
          path: '/setting/base',
          icon: ['fas', 'gears']
        }, {
          title: '主题设置',
          path: '/setting/style',
          icon: ['fas', 'wand-magic-sparkles']
        }, {
          title: '安全设置',
          path: '/setting/security',
          icon: ['fas', 'fingerprint']
        }, {
          title: '交互设置',
          path: '/setting/interaction',
          icon: ['fas', 'fire']
        }, {
          title: '菜单设置',
          path: '/setting/menu',
          icon: ['fas', 'bars']
        }, {
          title: 'CookieCloud',
          path: '/setting/cc',
          icon: ['fas', 'cookie']
        }, {
          title: '备份还原',
          path: '/setting/backup',
          icon: ['fas', 'floppy-disk']
        }]
      }, {
        title: '系统信息',
        path: '/info',
        icon: ['fas', 'circle-info'],
        sub: [{
          title: '系统信息',
          path: '/info/info',
          icon: ['fas', 'circle-info']
        }, {
          title: '系统日志',
          path: '/info/log',
          icon: ['fas', 'note-sticky']
        }, {
          title: '关于',
          path: '/info/about',
          icon: ['fas', 'circle-question']
        }]
      }
    ];
    for (const m of menu) {
      if (global.menu[0] && global.menu.indexOf(m.path) !== -1) {
        m.hidden = true;
      }
      if (m.sub) {
        for (const mm of m.sub) {
          if (global.menu[0] && global.menu.indexOf(mm.path) !== -1) {
            mm.hidden = true;
          }
        }
      }
    }
    return { menu };
  };
}

module.exports = UserMod;
