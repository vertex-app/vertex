<template>
  <div id="xterm" class="xterm" />
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
  mounted () {
    this.initSocket();
  },
  beforeDestroy () {
    this.socket.close();
    this.term.dispose();
  },
  methods: {
    initTerm () {
      const term = new Terminal({
        fontFamily: 'consolas',
        fontSize: 16,
        cols: parseInt((window.document.body.clientWidth - 200) / 6),
        rows: parseInt((window.document.body.clientHeight - 196) / 16),
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
      fitAddon.fit();
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
      this.socket = new WebSocket((protocol === 'http:' ? 'ws:' : 'wss:') + '//' + host + this.socketURI + this.$route.params.serverId);
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
  }
};
</script>
<style scoped>
.xterm {
  padding: 20px;
  height: 100%;
  text-align: left;
  border-radius: 4px;
}

.xterm, .xterm >>> * {
  font-family: consolas !important;
}

.xterm >>> .xterm {
  height: 100%;
  text-align: left;
  border-radius: 4px;
}

.xterm >>> .xterm-viewport {
  width: initial !important;
  height: initial !important;
}
</style>>
