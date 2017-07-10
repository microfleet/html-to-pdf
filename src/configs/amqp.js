const Promise = require('bluebird');

// quick way to check if action is adhoc
const renderAction = /\.render$/;
const isRenderAction = actionName => renderAction.test(actionName);

/**
 * Accepts/rejects messages to provide QoS and make sure we don't overload the machine
 */
function onComplete(err, data, actionName, actions) {
  if (!err) {
    actions.ack();
    return data;
  }

  if (err.name === 'ValidationError' || isRenderAction(actionName)) {
    this.log.fatal('invalid configuration, rejecting', err);
    actions.reject();
    return Promise.reject(err);
  }

  // assume that uploads may fail for some of the templates and we should retry them
  this.log.warn('Error performing operation %s. Scheduling retry', actionName, err);
  actions.retry();
  return Promise.reject(err);
}

/**
 * Specifies configuration for AMQP / RabbitMQ lib
 * @type {Object} amqp
 */
exports.amqp = {
  transport: {
    queue: 'pdfprinter',
    neck: 10,
    onComplete,
    connection: {
      host: 'rabbitmq',
    },
  },
  router: {
    enabled: true,
  },
};
