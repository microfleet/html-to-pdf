const Promise = require('bluebird');
const noop = require('lodash/noop');
const ChromeRemote = require('chrome-remote-interface');
const { encode } = require('64');
const { Launcher } = require('chrome-launcher');

const debug = require('debug')('ms-printer:chrome');

const _SIGINT = 'SIGINT';

class Chrome {
  /**
   * @static
   * Launches chrome browser
   * @return {Promise<Launcher>}
   */
  static async launch(settings) {
    const launcher = new Launcher(settings);

    try {
      await launcher.launch();
    } catch (e) {
      await launcher.kill();
      throw e;
    }

    return launcher;
  }

  constructor(opts = {}) {
    const {
      logger,
      timeout = 10000,
      ...restOpts
    } = opts;

    // chrome instance
    this.launcher = null;

    // settings
    this.settings = Object.assign({
      logLevel: 'info',
      port: 9222,
      chromeFlags: [
        '--window-size=1024,768',
        '--disable-gpu',
        '--no-sandbox',
        '--headless',
        '--remote-debugging-address=0.0.0.0',
      ],
      handleSIGINT: false,
    }, restOpts);

    // use custom logger if provided
    this.log = logger || debug;
    this.onLog = params => this.log.info(params.message.text);
    this.timeout = timeout;

    // Kill spawned Chrome process in case of ctrl-C.
    process.on(_SIGINT, async () => this.kill());
  }

  /**
   * Launches a debugging instance of Chrome on port 9222.
   * @return {Promise<Chrome>}
   */
  async init() {
    // Do nothing if chrome has been already initialized
    if (this.launcher) {
      return this;
    }

    try {
      this.launcher = await Chrome.launch(this.settings);
    } catch (e) {
      this.launcher = null;
      throw e;
    }

    return this;
  }

  /**
   * Correctly destructs the instance, killing running chrome browser
   * @returns {Promise<null>}
   */
  async kill() {
    // kill chrome instance if has been launched
    if (this.launcher) {
      await this.launcher.kill();
    }

    this.launcher = null;
    return null;
  }

  /**
   * Opens a new Chrome tab
   * @return {Promise<ChromeDebugProtocol>}
   */
  openTab() {
    return Promise
      .bind(ChromeRemote, this.launcher)
      .then(ChromeRemote.New)
      .then(target => ChromeRemote({ target, port: this.launcher.port }))
      .tap((tab) => {
        const { Network, Page, Console } = tab;

        Console.messageAdded(this.onLog);

        return Promise.all([Page.enable(), Network.enable()]);
      })
      .timeout(this.timeout)
      .disposer(tab => tab.close().catch(noop));
  }

  /**
   * Open a page inside a new tab and print out its contents as a PDF file
   * @param {String} html text to print out
   * @param {Object} opts page printing options
   * @return {Promise<String>} base64 encoded PDF document
   */
  printToPdf(html, opts = {}) {
    return Promise.using(this.openTab(), ({ Page }) => {
      const url = /^(https?|file|data):/i.test(html)
        ? html
        : `data:text/html;charset=utf-8;base64,${encode(Buffer.from(html))}`;

      return Promise
        .all([
          Page.loadEventFired(),
          Page.navigate({ url }),
        ])
        .return(Page)
        .call('printToPDF', opts)
        .get('data')
        .timeout(this.timeout);
    });
  }
}

module.exports = Chrome;
