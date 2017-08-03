const { Error, ValidationError, HttpStatusError } = require('common-errors');

// quick way to check if action is adhoc
const renderAction = /\.render$/;
const isRenderAction = actionName => renderAction.test(actionName);

/**
 * Specifies configuration for AMQP / RabbitMQ lib
 * @type {Object} amqp
 */
exports.amqp = {
  transport: {
    queue: 'ms-html-to-pdf',
    neck: 10,
    connection: {
      host: 'rabbitmq',
    },
  },
  router: {
    enabled: true,
  },
  retry: {
    enabled: true,
    min: 500,
    max: 5000,
    maxRetries: 5,
    predicate(err, actionName) {
      switch (err.constructor) {
        case ValidationError:
        case Error:
        case HttpStatusError:
          return true;

        default:
          return isRenderAction(actionName);
      }
    },
  },
};
