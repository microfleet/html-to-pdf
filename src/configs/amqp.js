const {
  ValidationError,
  HttpStatusError,
  NotFoundError,
  ArgumentError,
} = require('common-errors');

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
    neck: 5,
    bindPersistantQueueToHeadersExchange: true,
    connection: {
      host: 'rabbitmq',
    },
  },
  router: {
    enabled: true,
    prefix: 'pdf',
  },
  retry: {
    enabled: true,
    min: 1000,
    max: 60000,
    maxRetries: 10,
    predicate(err, actionName) {
      switch (err.constructor) {
        case ValidationError:
        case HttpStatusError:
        case NotFoundError:
        case ArgumentError:
          return true;

        default:
          // retry unless it's validation & http status error
          return isRenderAction(actionName) === false;
      }
    },
  },
};
