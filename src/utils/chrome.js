const Promise = require('bluebird');
const noop = require('lodash/noop');
const ChromeRemote = require('chrome-remote-interface');
const { encode } = require('64');
const { Launcher, defaultFlags } = require('chrome-launcher');
const { HttpStatusError } = require('common-errors');
const clone = require('rfdc')({ proto: false, circles: false });
const debug = require('debug')('ms-printer:chrome');

const _SIGINT = 'SIGINT';
const kStatusCheckHTML = '<html><head><title>status</title></head><body></body></html>';

class Chrome {
  /**
   * @static
   * Launches chrome browser
   * @return {Promise<Launcher>}
   */
  static async launch(settings) {
    const launcher = new Launcher(clone(settings));

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
      timeout = 7500,
      ...restOpts
    } = opts;

    // chrome instance
    this.launcher = null;
    this.restarting = null;

    // settings
    this.settings = Object.assign({
      logLevel: 'info',
      port: 0, // generates random port
      chromeFlags: [
        '--window-size=1024,768',
        '--disable-gpu',
        '--no-sandbox',
        '--headless',
        '--remote-debugging-address=0.0.0.0',
      ],
      handleSIGINT: false,
    }, restOpts);

    // NOTE: this is a temporary workaround for
    // https://github.com/GoogleChrome/chrome-launcher/pull/162
    this.settings.ignoreDefaultFlags = true;
    this.settings.chromeFlags = [
      ...defaultFlags(),
      ...this.settings.chromeFlags,
    ];

    // use custom logger if provided
    this.log = logger || {
      info: (...args) => debug('[info]', ...args),
      debug: (...args) => debug('[debug]', ...args),
    };

    this.onLog = params => this.log.info(params.message.text);
    this.timeout = timeout;

    // Kill spawned Chrome process in case of ctrl-C.
    process.on(_SIGINT, async () => this.kill());
  }

  /**
   * Verifies that chrome has started
   * @return {Promise}
   */
  async waitForStart() {
    if (this.starting == null) {
      return;
    }

    try {
      await this.starting;
    } catch (e) {
      throw new HttpStatusError(502, 'chrome failed to start');
    }
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
      this.starting = Chrome.launch(this.settings);
      this.launcher = await this.starting;
    } catch (e) {
      this.launcher = null;
      throw e;
    } finally {
      this.starting = null;
    }

    return this;
  }

  /**
   * Correctly destructs the instance, killing running chrome browser
   * @returns {Promise<null>}
   */
  async kill() {
    try {
      await this.waitForStart();
    } catch (e) {
      return;
    }

    const { launcher } = this;

    // kill chrome instance if has been launched
    if (launcher) {
      this.launcher = null;
      await launcher.kill();
    }
  }

  async status(attempt = 0) {
    await this.waitForStart();

    this.log.debug('evaluating chrome health');

    try {
      await this.printToPdf(kStatusCheckHTML);
      return true;
    } catch (e) {
      this.log.warn({ err: e }, 'failed chrome status check');
      if (attempt > 0) {
        throw new HttpStatusError(504, `failed to open tab: ${e.message}`);
      }
    }

    try {
      this.log.warn('restarting chrome due to a healthcheck error');
      await Promise.all([this.kill(), this.init()]);
    } catch (e) {
      this.log.fatal({ err: e }, 'failed to restart chrome');
      throw new HttpStatusError(500, 'failed to restart chrome');
    }

    // do a second attempt after restart
    return this.status(1);
  }

  /**
   * Disposer for assosiated tab/client
   * @param  {Target}  target
   * @param  {ChromeRemote}  client
   * @return {Promise}
   */
  static async disposer(target, client) {
    if (target) await ChromeRemote.Close({ id: target.id }).catch(noop);
    if (client) await client.close().catch(noop);
  }

  /**
   * Opens a new Chrome tab
   * @return {Promise<ChromeDebugProtocol>}
   */
  async openTab() {
    await this.waitForStart();

    let client;
    let target;

    try {
      target = await ChromeRemote.New(this.launcher);
      this.log.debug({ target }, 'opened new target');
      client = await ChromeRemote({ target, port: this.launcher.port });

      const { Network, Page, Console } = client;
      Console.messageAdded(this.onLog);

      await Promise
        .all([Page.enable(), Network.enable()])
        .timeout(this.timeout);
    } catch (e) {
      Chrome.disposer(target, client);
      throw e;
    }

    return { target, client };
  }

  /**
   * Open a page inside a new tab and print out its contents as a PDF file
   * @param {String} html text to print out
   * @param {Object} opts page printing options
   * @return {Promise<String>} base64 encoded PDF document
   */
  async printToPdf(html, opts = {}) {
    let tab;
    try {
      tab = await this.openTab();
      const { client: { Page } } = tab;

      const url = /^(https?|file|data):/i.test(html)
        ? html
        : `data:text/html;charset=utf-8;base64,${encode(Buffer.from(html))}`;

      return await Promise
        .all([Page.loadEventFired(), Page.navigate({ url })])
        .return(Page)
        .call('printToPDF', opts)
        .get('data')
        .timeout(this.timeout);
    } finally {
      // schedules in the "background", no await is needed
      if (tab) Chrome.disposer(tab.target, tab.client);
    }
  }
}

module.exports = Chrome;
