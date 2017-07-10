const glob = require('glob');
const fs = require('fs');
const mu2 = require('mu2');
const assert = require('assert');

const { ValidationError } = require('common-errors');

// template missing error
const TemplateMissing = new ValidationError('template not initialized', 400);

module.exports = function initMustache(config) {
  const { pdfPrinter } = config;
  const _templates = pdfPrinter._templates = Object.create(null);

  // enumerate templates templates
  glob
    .sync('**/*.tpl', { cwd: pdfPrinter.templates })
    .reduce((acc, file) => {
      const template = fs.readFileSync(`${pdfPrinter.templates}/${file}`, 'utf8');
      const name = file.slice(0, -4);

      // cb called in a sync fashion
      mu2.compileText(name, template, (err, parsedTemplate) => {
        if (err) throw err;
        acc[name] = parsedTemplate;
      });

      return acc;
    }, _templates);

  pdfPrinter.getTemplate = (name) => {
    const template = _templates[name];
    // ensure that template is defined
    assert.ifError(template ? undefined : TemplateMissing);
    return template;
  };
};
