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
    this.irc = { ...irc };
    this.client = null;
    this.initIRC();
  };

  handleMessage (message) {
    if (message.command === 'PRIVMSG' || message.user === this.irc.announcer) {

    }
  }

  initIRC () {
    this.client = new Client(this.irc.host, this.irc.nick, {
      userName: this.irc.user || this.irc.nick,
      realName: this.irc.user || this.irc.nick,
      port: this.irc.port,
      showErrors: true,
      secure: true,
      selfSigned: true,
      retryDelay: 5000
    });
  }
}

module.exports = IRC;
