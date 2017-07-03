const Latex = require('../../src');
const amqpConfig = require('../configs/amqp');
const log = require('debug')('ms-latex:test');

describe('render action', () => {
  let send;

  beforeAll(() => {
    const service = this.service = new Latex({ ...amqpConfig });

    return service
      .connect()
      .tap(() => {
        const amqp = this.amqp = service.amqp;

        send = function _send(route, message, timeout = 15000) {
          return amqp.publishAndWait(route, message, { timeout });
        };
      });
  });

  it('should render & upload document', () => {
    const message = {
      tex: 'example_2',
      input: {
        title: 'test',
      },
      meta: {
        meta: {
          name: 'example.pdf',
        },
        username: 'test',
        unlisted: true,
        access: {
          setPublic: true,
        },
      },
    };

    return send('latex.render', message)
      .then(response => {
        log('res:', response);
      })
      .catch(err => {
        log('err:', err);
      });
  });
});
