const glob = require('glob');
const fs = require('fs');
const assert = require('assert');
const mustache = require('mustache');

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

      mustache.parse(template);
      acc[name] = template;

      return acc;
    }, _templates);

  pdfPrinter.getTemplate = (name) => {
    const template = _templates[name];
    // ensure that template is defined
    assert.ifError(template ? undefined : TemplateMissing);
    return template;
  };
};
