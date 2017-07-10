const mu2 = require('mu2');
const bl = require('bl');
const initMustache = require('../../src/utils/mustache');
const config = require('../../src/config');

describe('mustacheStream', () => {
  const conf = config.get('/', { env: process.env.NODE_ENV });
  const templateName = 'plain';
  const sampleView = {
    name: 'example',
  };

  const renderedTemplate = `
    Hello, ${sampleView.name}
  `;

  it('inits templates', () => {
    initMustache(conf);

    // must be defined
    expect(conf.pdfPrinter._templates[templateName]).toBeDefined();
  });

  it('returns template by its own name', () => {
    const template = conf.pdfPrinter.getTemplate(templateName);
    expect(template).toBeDefined();
  });

  it('throws an error when a requested template is missed', () => {
    expect(() => conf.pdfPrinter.getTemplate('some-random-template-name')).toThrow();
  });

  it('renders mustache template', (next) => {
    const template = conf.pdfPrinter.getTemplate(templateName);
    mu2.render(template, sampleView).pipe(bl((err, view) => {
      if (err) {
        return next(err);
      }

      expect(view).toBe(renderedTemplate);
      return next();
    }));
  });
});
