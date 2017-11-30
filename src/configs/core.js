const path = require('path');

/**
 * Default name of the service
 * @type {String}
 */
exports.name = 'ms-printer';

/**
 * Enables plugins. This is a minimum list
 * @type {Array}
 */
exports.plugins = [
  'validator',
  'logger',
  'router',
  'amqp',
];

/**
 * Bunyan logger configuration
 * @type {Boolean}
 */
exports.logger = {
  name: '@microfleet/html-to-pdf',
  defaultLogger: true,
  debug: process.env.NODE_ENV !== 'production',
};

/**
 * Local schemas for validation
 * @type {Array}
 */
exports.validator = {
  schemas: [path.resolve(__dirname, '../../schemas')],
  ajv: {
    $meta: 'ms-validation AJV schema validator options',
  },
};

exports.pdfPrinter = {
  templates: {
    $filter: 'env',
    $default: path.resolve(__dirname, '../../__tests__/fixtures/templates'),
    production: '/src/templates',
  },
  retryOptions: {
    interval: 1000,
    timeout: 30000,
    max_tries: 5,
    backoff: 1.2,
    disabled: false,
  },
};

exports.chrome = {
  /**
   * Chrome Render Timeout.
   * @type {number}
   */
  timeout: 2000,
};
