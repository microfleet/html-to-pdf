const Printer = require('../../src');
const amqpConfig = require('../configs/amqp');

describe('render action', () => {
  let send;

  // jasmine global var
  // eslint-disable-next-line no-undef
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

  beforeAll(() => {
    const service = this.service = new Printer({ ...amqpConfig });

    return service
      .connect()
      .tap(() => {
        const amqp = this.amqp = service.amqp;

        send = function _send(route, message, timeout = 15000) {
          return amqp.publishAndWait(route, message, { timeout });
        };
      });
  });

  it('should render & return documents', async () => {
    const message = {
      template: 'htmlView',
      context: {
        name: 'World',
      },
      meta: false,
    };

    return send('pdf.render', message)
      .tap((data) => {
        expect(data).toMatch(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/);
      });
  });

  it('should render & upload document', async () => {
    const message = {
      template: 'htmlView',
      context: {
        name: 'World',
      },
      meta: {
        meta: {
          name: 'hello-world.pdf',
        },
        username: 'test',
        unlisted: true,
        access: {
          setPublic: true,
        },
      },
    };

    return send('pdf.render', message)
      .tap((data) => {
        expect(data).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
      });
  });

  afterAll(() => {
    return this.service.close();
  });
});
