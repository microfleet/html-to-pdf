const mustache = require('mustache');
const initMustache = require('../../src/utils/mustache');
const config = require('../../src/config');

describe('mustacheStream', () => {
  const conf = config.get('/', { env: process.env.NODE_ENV });
  const templateName = 'plain';
  const sampleView = {
    name: 'example',
  };

  const renderedTemplate = `Hello, ${sampleView.name}\n`;

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

  it('renders mustache template', () => {
    const template = conf.pdfPrinter.getTemplate(templateName);
    const html = mustache.render(template, sampleView);

    expect(html).toBe(renderedTemplate);
  });
});
