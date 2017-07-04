const fs = require('fs');
const path = require('path');
const pump = require('pump');
const Latex = require('../../src');

const uploadStream = require('../../src/utils/uploadStream');
const amqpConfig = require('../configs/amqp');
const log = require('debug')('ms-latex:test');

const FILENAME = path.resolve(__dirname, '../fixtures/sample.pdf');

describe('render action', () => {
  let service;

  beforeAll(() => {
    service = this.service = new Latex({ ...amqpConfig });

    return service
      .connect()
      .tap(() => {
        this.amqp = service.amqp;
      });
  });

  afterAll(() => {
    return this.service.close()
      .finally(() => {
        service = this.service = null;
      });
  });

  it('should upload document', (callback) => {
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

    const filestream = fs.createReadStream(FILENAME);
    const upload = uploadStream.call(service, message);

    pump(
      filestream,
      upload,
      (err, res) => {
        log('error:', err);
        log('response:', res);
        callback(err);
      }
    );
  });
});
