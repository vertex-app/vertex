const Mutex = require('./mutex');

class BrowserManager {
  constructor (launch, maxActive = 8) {
    this.launch = launch;
    this.mutex = new Mutex();
    this.browser = null;
    this.active = 0;
    this.closed = false;
    this.maxActive = maxActive;
  }

  async run (task) {
    let context;
    await this.mutex.runExclusive('browser', async () => {
      if (this.closed) throw new Error('浏览器已关闭');
      if (this.active >= this.maxActive) throw new Error('浏览器任务已满，请稍后重试');
      if (!this.browser || !this.browser.connected) this.browser = await this.launch();
      try {
        context = await this.browser.createBrowserContext();
      } catch (err) {
        if (!this.active) {
          const browser = this.browser;
          this.browser = null;
          await browser.close();
        }
        throw err;
      }
      this.active++;
    });
    try {
      const page = await context.newPage();
      return await task(page, context);
    } finally {
      try { await context.close(); } finally {
        await this.mutex.runExclusive('browser', async () => {
          this.active--;
          if (!this.active && this.browser) {
            const browser = this.browser;
            this.browser = null;
            await browser.close();
          }
        });
      }
    }
  }

  async close () {
    await this.mutex.runExclusive('browser', async () => {
      this.closed = true;
      if (this.browser) {
        const browser = this.browser;
        this.browser = null;
        await browser.close();
      }
    });
  }
}

module.exports = BrowserManager;
