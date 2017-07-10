const Promise = require('bluebird');
const Mservice = require('@microfleet/core');
const merge = require('lodash/merge');

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

    // initializes mustache to latex streams
    require('./utils/mustache')(this.config);

    // define chrome config
    this.chrome = new Chrome(this.config.chrome);
  }

  connect() {
    return super.connect()
      .tap(async () => this.chrome.init());
  }

  close() {
    return Promise.resolve(this.chrome.kill())
      .then(() => super.close());
  }

};
