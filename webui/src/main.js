import Vue from 'vue';
import VueClipboard from 'vue-clipboard2';
import {
  Button, Select, Input, Message, Image, Row, Col, Card, Link, MessageBox,
  Divider, Tag, Pagination, DatePicker, TimePicker, Upload, Checkbox, Option,
  Icon, Table, TableColumn, Backtop, Tabs, TabPane, Container, Header, Main, Aside,
  Menu, MenuItem, MenuItemGroup, Descriptions, DescriptionsItem, Progress, Dropdown,
  DropdownMenu, DropdownItem, Collapse, CollapseItem, Form, FormItem, Radio, RadioGroup,
  CheckboxGroup, Switch, Dialog, PageHeader, Drawer, Loading
} from 'element-ui';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import solid from '@fortawesome/fontawesome-free-solid';
import brands from '@fortawesome/fontawesome-free-brands';
import App from '@/App.vue';
import router from '@/routes/index';
import axios from 'axios';
import moment from 'moment';
import md5 from 'md5-node';
import ECharts from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, GaugeChart, LineChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, TitleComponent,
  LegendComponent, VisualMapComponent, GraphicComponent
} from 'echarts/components';

use([CanvasRenderer, BarChart, LineChart, GridComponent, GaugeChart,
  TooltipComponent, TitleComponent, LegendComponent, VisualMapComponent,
  GraphicComponent]);

Vue.prototype.$message = Message;
Vue.prototype.$moment = moment;
Vue.prototype.$md5 = md5;
Vue.prototype.$messageBox = MessageBox;

Vue.config.productionTip = false;
const components = [
  Button, Input, Select, Image, Row, Col, Card, Link, Divider, Tag, Pagination,
  DatePicker, TimePicker, Upload, Checkbox, Option, Icon, Table, TableColumn,
  Backtop, Tabs, TabPane, Container, Header, Main, Aside, Menu, MenuItem, MenuItemGroup,
  Progress, Dropdown, DropdownMenu, DropdownItem, Collapse, CollapseItem, Form, FormItem, Radio,
  RadioGroup, CheckboxGroup, Switch, Dialog, PageHeader, Drawer, Loading,
  Descriptions, DescriptionsItem
];

Vue.component('v-chart', ECharts);
components.forEach((component) => Vue.use(component));

Vue.use(VueClipboard);

library.add(solid);
library.add(brands);
Vue.component('fa', FontAwesomeIcon);

Vue.prototype.$colors = [
  ['#00BFFF', '#FFFFFF'],
  ['#FFCC00', '#009966'],
  ['#336699', '#FFFFFF'],
  ['#CC3366', '#FFFFFF'],
  ['#009966', '#FFFFFF'],
  ['#FA8072', '#FFFFFF'],
  ['#F0FFFF', '#409EFF'],
  ['#FAFAD2', '#409EFF'],
  ['#FFC0CB', '#409EFF']
];

Vue.prototype.$axiosGet = async (url) => {
  try {
    const res = await axios.get(url, {
      validateStatus: () => true
    });
    if (!res.data.success) {
      throw new Error(res.data.message);
    }
    return res.data;
  } catch (error) {
    Vue.prototype.$message.error(error.message);
  }
  return undefined;
};

Vue.prototype.$goto = (url, router) => {
  router.push(url);
};

Vue.prototype.$axiosPost = async (url, json, lang = 'zh-cn') => {
  try {
    const res = await axios.post(url, json, {
      validateStatus: () => true
    });
    if (!res.data.success) {
      throw new Error(res.data.message);
    }
    return res.data;
  } catch (error) {
    Vue.prototype.$message.error(error.message);
  }
  return undefined;
};

Vue.prototype.$formatSize = (_size) => {
  const tag = _size < 0;
  const size = Math.abs(_size);
  if (size < 1024) {
    return (tag ? '-' : '') + `${size.toFixed(2)} Byte`;
  }
  if (size < 1024 * 1024) {
    return (tag ? '-' : '') + `${(size / 1024).toFixed(2)} KiB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return (tag ? '-' : '') + `${(size / 1024 / 1024).toFixed(2)} MiB`;
  }
  if (size < 1024 * 1024 * 1024 * 1024) {
    return (tag ? '-' : '') + `${(size / 1024 / 1024 / 1024).toFixed(2)} GiB`;
  }
  if (size < 1024 * 1024 * 1024 * 1024 * 1024) {
    return (tag ? '-' : '') + `${(size / 1024 / 1024 / 1024 / 1024).toFixed(2)} TiB`;
  }
  if (size < 1024 * 1024 * 1024 * 1024 * 1024 * 1024) {
    return (tag ? '-' : '') + `${(size / 1024 / 1024 / 1024 / 1024 / 1024).toFixed(3)} PiB`;
  }
  return '0 Byte';
};

const formatTime = (s) => s === 0 ? '00' : s < 10 ? '0' + s : s;

Vue.prototype.$formatTime = (time) => {
  const day = formatTime(Math.floor(time / 86400));
  const hour = formatTime(Math.floor(time % 86400 / 3600));
  const minite = formatTime(Math.floor(time % 3600 / 60));
  const second = formatTime(time % 60);
  return [day, hour, minite, second].join(':');
};

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title + ' :: Vertex';
  }
  next();
});

// eslint-disable-next-line no-new
new Vue({
  el: '#app',
  router,
  render: h => h(App)
});
