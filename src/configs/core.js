const path = require('path');

/**
 * Default name of the service
 * @type {String}
 */
exports.name = 'ms-latex';

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

/**
 * Location of LaTeX files
 */
exports.latex = {
  $filter: 'env',
  $default: {
    templates: path.resolve(__dirname, '../../__tests__/fixtures/latex'),
  },
  production: {
    // valid configuration for docker
    templates: '/src/templates',
  },
};
