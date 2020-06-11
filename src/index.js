const { Microfleet, ConnectorsTypes } = require('@microfleet/core');
const { PluginHealthCheck } = require('@microfleet/core/lib/utils/pluginHealthStatus');
const merge = require('lodash/merge');

const Mustache = require('./utils/mustache');
const Chrome = require('./utils/chrome');

/**
 * @class PdfPrinter
 * @param {Object} opts - any overrides
 * @returns {Mailer}
 */
class PdfPrinter extends Microfleet {
  /**
   * Updates default options and sets up predefined accounts
   * @param  {Object} opts
   * @return {Mailer}
   */
  constructor(opts = {}) {
    super(merge({}, PdfPrinter.defaultOpts, opts));

    // config
    const { config } = this;

    // initializes mustache to latex streams
    Mustache(config);

    // propagate logger to chrome
    config.chrome.logger = this.log.child({ component: 'chrome' });

    // define chrome config
    const chrome = this.chrome = new Chrome(this.config.chrome);

    // add connectors & disconnectors
    this.addConnector(ConnectorsTypes.essential, chrome.init.bind(chrome));
    this.addDestructor(ConnectorsTypes.essential, chrome.kill.bind(chrome));
    this.addHealthCheck(new PluginHealthCheck('chrome', chrome.status.bind(chrome)));
  }
}

/**
 * Default options that are merged into core
 * @type {Object}
 */
PdfPrinter.defaultOpts = require('./config').get('/', { env: process.env.NODE_ENV });

module.exports = PdfPrinter;
