<template>
  <div style="font-size: 24px; font-weight: bold;">SHELL</div>
  <a-divider></a-divider>
  <div class="shell">
    <div id="xterm" class="xterm" />
  </div>
</template>
<script>
import 'xterm/css/xterm.css';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';

export default {
  name: 'Xterm',
  props: {
    socketURI: {
      type: String,
      default: '/api/server/shell/'
    }
  },
  methods: {
    initTerm () {
      const term = new Terminal({
        fontFamily: 'consolas',
        fontSize: 16,
        cols: 156, // parseInt((window.document.body.clientWidth - 232) / 7.6),
        rows: 44, // parseInt((window.document.body.clientHeight - 128) / 16),
        cursorBlink: true,
        customGlyphs: false,
        // theme: 'light',
        // rendererType: 'dom',
        cursorStyle: 'bar'
      });
      const websocket = this.socket;
      const attachAddon = new AttachAddon(this.socket);
      const fitAddon = new FitAddon();
      term.loadAddon(attachAddon);
      term.loadAddon(fitAddon);
      term.open(document.getElementById('xterm'));
      term.focus();
      this.term = term;
      setTimeout(() => {
        fitAddon.fit();
        websocket.send(`setWindow:${term.rows}:${term.cols}`);
      }, 1000);
      setTimeout(() => {
        fitAddon.fit();
        websocket.send(`setWindow:${term.rows}:${term.cols}`);
      }, 3000);
      setTimeout(() => {
        fitAddon.fit();
        websocket.send(`setWindow:${term.rows}:${term.cols}`);
      }, 5000);
      term.onResize(function (evt) {
        websocket.send(`setWindow:${evt.rows}:${evt.cols}`);
      });
      window.onresize = function () {
        fitAddon.fit();
      };
    },
    initSocket () {
      const { protocol, host } = window.document.location;
      this.socket = new WebSocket((protocol === 'http:' ? 'ws:' : 'wss:') + '//' + host + this.socketURI + this.$route.params.id);
      this.socketOnClose();
      this.socketOnOpen();
      this.socketOnError();
    },
    socketOnOpen () {
      this.socket.onopen = () => {
        // 链接成功后
        this.initTerm();
      };
    },
    socketOnClose () {
      this.socket.onclose = () => {
        this.term.writeln('\r\n*** SSH SHELL DISCONNECTED ***\r\n');
      };
    },
    socketOnError () {
      this.socket.onerror = () => {
        // console.log('socket 链接失败')
      };
    }
  },
  async mounted () {
    this.initSocket();
  },
  beforeUnmount () {
    this.socket.close();
    this.term.dispose();
  }
};
</script>
<style scoped>
.shell {
  height: calc(100% - 96px);
  width: 100%;
  margin: 0 auto;
}

.xterm {
  height: 100%;
  text-align: left;
  border-radius: 4px;
}

.xterm, .xterm:deep(*) {
  font-family: consolas !important;
}

.xterm:deep(.xterm) {
  height: 100%;
  text-align: left;
  border-radius: 4px;
}

.xterm:deep(.xterm-viewport) {
  width: initial !important;
  height: initial !important;
}

</style>
