const Mservice = require('@microfleet/core');
const merge = require('lodash/merge');

/**
 * @class Mailer
 * @param {Object} opts - any overrides
 * @returns {Mailer}
 */
module.exports = class LaTeX extends Mservice {

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
    super(merge({}, LaTeX.defaultOpts, opts));

    // initializes mustache to latex streams
    require('./utils/mustacheToLatex')(this.config);
  }
};
