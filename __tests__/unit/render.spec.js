const request = require('request-promise').defaults({
  baseUrl: 'http://localhost:3000',
});

describe('render action', () => {
  const Printer = require('../../src');
  const amqpConfig = require('../configs/amqp');

  let service;
  let amqpClient;

  // jasmine global var
  // eslint-disable-next-line no-undef
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

  function send(route, message, timeout = 15000) {
    return amqpClient.publishAndWait(route, message, { timeout });
  }

  beforeAll(async () => {
    service = new Printer({ ...amqpConfig });
    await service.connect();
    amqpClient = service.amqp;
  });

  it('should render & return documents', async () => {
    const message = {
      template: 'htmlView',
      context: {
        name: 'World',
      },
      meta: false,
    };

    const data = await send('pdf.render', message);
    expect(data).toMatch(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/);
  });

  it('should render & return documents: cyrillic', async () => {
    const message = {
      template: 'font',
      context: {},
      meta: false,
    };

    const data = await send('pdf.render', message);
    expect(data).toMatch(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/);
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

    const data = await send('pdf.render', message);
    expect(data).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
  });

  it('should render & upload document', async () => {
    const message = {
      template: 'font',
      context: {},
      meta: {
        meta: {
          name: 'font.pdf',
        },
        username: 'test',
        unlisted: true,
        access: {
          setPublic: true,
        },
      },
    };

    const data = await send('pdf.render', message);
    expect(data).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
  });

  it('healh check should return successful response', async () => {
    await request.get('/generic/health');
  });

  afterAll(async () => {
    await service.close();
  });
});
