/* eslint-disable no-control-regex */
const logger = require('../libs/logger');
const { Client } = require('matrix-org-irc');

class IRC {
  constructor (irc) {
    /*
    irc: {
      host,
      port,
      nick,
      user,
      channel,
      announcer,
      regexp
    }
    */
    this.id = irc.id;
    this.alias = irc.alias;
    this.irc = { ...irc };
    this.client = null;
    this.initIRC();
  };

  handleMessage (message) {
    if (message.command === 'PRIVMSG' && message.nick === this.irc.announcer) {
      if (message.args[1] === this.irc.welcomeText) {
        logger.info(message.args[1]);
        logger.info('IRC', this.alias, '已进入 Announce 频道');
      } else {
        const formatMessage = message.args[1]
          .replace(/\x02\d{2}([^\d])/g, '$1')
          .replace(/\x03\d{2}([^\d])/g, '$1')
          .replace(/\x02/g, '')
          .replace(/\x03/g, '');
        const regRes = formatMessage.match(/TORRENT: (.*?) - (https:\/\/.*?) \/ (https:\/\/.*)/);
        if (regRes) {
          const torrent = {
            title: regRes[1],
            link: regRes[2],
            url: regRes[3]
          };
          logger.info(torrent);
        } else {
          logger.info(message.args[1]);
        }
      }
    }
    if (message.command === 'NOTICE') {
      if (message.nick === 'NickServ' && message.args[1] === 'please choose a different nick.') {
        this.client.say('NickServ', `IDENTIFY ${this.irc.password}`);
      }
      if (message.nick === 'NickServ' && message.args[1] === 'Password accepted - you are now recognized.') {
        this.client.say(this.irc.announcer, `ENTER ${this.irc.channel} ${this.irc.user} ${this.irc.ircKey}`);
      }
    }
  }

  initIRC () {
    const _this = this;
    this.client = new Client(this.irc.host, this.irc.nick, {
      userName: this.irc.user || this.irc.nick,
      realName: this.irc.user || this.irc.nick,
      port: this.irc.port,
      secure: true,
      selfSigned: true,
      retryDelay: 5000
    }).on('raw', (message) => this.handleMessage.call(_this, message));
  }
}

module.exports = IRC;
