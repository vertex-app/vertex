import api from './api';
import moment from 'moment';
import 'less';
import { createApp, ref, defineComponent } from 'vue';
import {
  Button, Form, Input, Message, Menu, Layout,
  Drawer, Table, Divider, Descriptions, Col, Row, Tag,
  Checkbox, Select, Dropdown, Switch, Upload, Modal,
  Radio, Popover, Tree, Alert, notification as Notification,
  Space
} from 'ant-design-vue';
import App from './App';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  GraphicComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import 'zrender/lib/svg/svg';
import VueLazyLoad from 'vue-lazyload-next';
import md5 from 'md5-node';

import router from './routes';
import './registerServiceWorker';

library.add(fas);
library.add(fab);

use([
  CanvasRenderer,
  PieChart,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  GraphicComponent,
  DataZoomComponent,
  ToolboxComponent
]);

const app = createApp(App);
const components = [
  Button, Form, Input, Menu, Layout, Drawer,
  Table, Divider, Descriptions, Col, Row, Tag,
  Checkbox, Select, Dropdown, Switch, Upload, Modal,
  Radio, Popover, Tree, Alert, Space
];

for (const component of components) {
  app.use(component);
}

app.use(VueLazyLoad, {
  loading: '/assets/images/loading.gif'
});

app.component('v-chart', VChart);

app.component('v-nodes', (_, {
  attrs
}) => {
  return attrs.vnodes;
});

app.component('fa', FontAwesomeIcon);

router.beforeEach((to, from) => {
  if (to.meta.title) {
    document.title = to.meta.title + ' :: Vertex';
  }
});

app.use(router);

const message = () => {
  return Message;
};

const notification = () => {
  return Notification;
};

const formatSize = (_size) => {
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

app.mixin({
  methods: {
    $goto: (a, b) => {
      b.push(a);
    },
    $api: api,
    $moment: moment,
    $message: message,
    $notification: notification,
    $defineComponent: defineComponent,
    $formatSize: formatSize,
    $ref: ref,
    $md5: md5
  }
});

app.mount('#app');
