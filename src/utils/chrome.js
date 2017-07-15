const Promise = require('bluebird');
const ChromeRemote = require('chrome-remote-interface');
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
      return launcher;
    } catch (e) {
      await launcher.kill();
      throw e;
    }
  }

  constructor(opts = {}) {
    const { logger, ...restOpts } = opts;

    // chrome instance
    this.launcher = null;

    // settings
    this.settings = Object.assign({
      logLevel: 'verbose',
      chromeFlags: [
        '--window-size=1024,768',
        '--disable-gpu',
        '--no-sandbox',
        '--headless',
      ],
    }, restOpts);

    // use custom logger if provided
    this.log = logger || debug;
    this.onLog = params => this.log.info(params.message.text);

    // Kill spawned Chrome process in case of ctrl-C.
    process.on(_SIGINT, async () => (
      this.kill()
    ));
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
      return this;
    } catch (e) {
      this.launcher = null;
      throw e;
    }
  }

  /**
   * Correctly destructs the instance, killing running chrome browser
   * @returns {Promise<null>}
   */
  async kill() {
    try {
      // kill chrome instance if has been launched
      if (this.launcher) {
        await this.launcher.kill();
      }
      this.launcher = null;
      return null;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Opens a new Chrome tab
   * @return {Promise<ChromeDebugProtocol>}
   */
  async openTab() {
    const target = await ChromeRemote.New(this.launcher);
    const tab = await ChromeRemote({ target });

    const { Network, Page, Console } = tab;

    Console.messageAdded(this.onLog);

    return Promise
      .all([
        Page.enable(),
        Network.enable(),
      ])
      .return(tab);
  }

  /**
   * Open a page inside a new tab and print out its contents as a PDF file
   * @param {String} html text to print out
   * @param {Object} opts page printing options
   * @return {Promise<String>} base64 encoded PDF document
   */
  async printToPdf(html, opts = {}) {
    const tab = await this.openTab();
    try {
      const { Page } = tab;
      const url = /^(https?|file|data):/i.test(html) ? html : `data:text/html,${html}`;

      await Page.navigate({ url });
      await Page.loadEventFired();

      // https://chromedevtools.github.io/debugger-protocol-viewer/tot/Page/#method-printToPDF
      const pdf = await Page.printToPDF(opts);

      return pdf.data;
    } finally {
      await tab.close();
    }
  }
}

module.exports = Chrome;
