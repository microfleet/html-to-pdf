const mu2 = require('mu2');
const bl = require('bl');
const initMustacheToLatex = require('../../src/utils/mustacheToLatex');
const latex = require('../../src/utils/latex');
const config = require('../../src/config');

describe('mustacheToLatexStream', () => {
  const conf = config.get('/', { env: process.env.NODE_ENV });
  const sampleView = {
    title: 'example',
  };

  beforeAll(() => initMustacheToLatex(conf));

  test('renders mustache to tex definition', (next) => {
    const template = conf.tex.example_2;

    mu2.render(template, sampleView).pipe(latex()).pipe(bl((err) => {
      if (err) {
        return next.fail(err);
      }

      return next();
    }));
  });
});
