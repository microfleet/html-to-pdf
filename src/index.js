const Mservice = require('@microfleet/core');
const merge = require('lodash/merge');

const Mustache = require('./utils/mustache');
const Chrome = require('./utils/chrome');

/**
 * @class PdfPrinter
 * @param {Object} opts - any overrides
 * @returns {Mailer}
 */
module.exports = class PdfPrinter extends Mservice {
  /**
   * Default options that are merged into core
   * @type {Object}
   */
  static defaultOpts = require('./config').get('/', { env: process.env.NODE_ENV });

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
    if (this._log) config.chrome.logger = this._log.child({ component: 'chrome' });

    // define chrome config
    const chrome = this.chrome = new Chrome(this.config.chrome);

    // add connectors & disconnectors
    this.addConnector(Mservice.ConnectorsTypes.essential, chrome.init.bind(chrome));
    this.addDestructor(Mservice.ConnectorsTypes.essential, chrome.kill.bind(chrome));
  }
};
