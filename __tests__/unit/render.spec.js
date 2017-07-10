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

    // const data = await send('pdfprinter.render', message);
    return send('pdfPrinter.render', message)
      .tap(data => {
        console.log(data);
      });
  });

  afterAll(() => {
    return this.service.close();
  });
});
