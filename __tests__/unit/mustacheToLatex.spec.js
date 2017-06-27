const mu2 = require('mu2');
const bl = require('bl');
const initMustacheToLatex = require('../../src/utils/mustacheToLatex');
const config = require('../../src/config');

const renderedTemplate = `\\documentclass[14pt, a4paper]{article}
\\usepackage[utf8]{inputenc}
\\title{example}
`;

describe('mustacheToLatexStream', () => {
  const conf = config.get('/', { env: process.env.NODE_ENV });
  const sampleView = {
    title: 'example',
  };

  it('inits templates', () => {
    initMustacheToLatex(conf);

    // must be defined
    expect(conf.tex.example).toBeDefined();
    expect(conf.inputs.example).toBeDefined();
  });

  it('renders mustache to tex definition', (next) => {
    const template = conf.tex.example;
    mu2.render(template, sampleView).pipe(bl((err, latex) => {
      if (err) {
        return next(err);
      }

      expect(latex).toBe(renderedTemplate);
      return next();
    }));
  });
});
