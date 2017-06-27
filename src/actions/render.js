const Promise = require('bluebird');
const mu2 = require('mu2');
const assert = require('assert');
const pump = require('pump');
const { ValidationError } = require('common-errors');
const latex = require('../utils/latex');
const uploadStream = require('../utils/uploadStream');

// template missing error
const TemplateMissing = new ValidationError('template not initialized', 400);

/**
 * Renders LaTeX template and stores it based on the passed configuration
 * @param  {MserviceRequest} data - Incoming request.
 * @param  {Object} data.params - Input payload for the request.
 * @returns {Promise<*>} data with file location.
 */
module.exports = function render({ params }) {
  const template = this.config.tex[params.tex];

  // ensure that template is defined
  assert.ifError(template ? undefined : TemplateMissing);

  // render and store PDF
  Promise.fromCallback((next) => {
    let response = null;

    // we need to pull response of uploadStream
    const mustacheToLaTeX = mu2.render(template, params.input);
    const LaTeXtoPDF = latex();
    const storePDFStream = uploadStream(params.meta);

    // will only have 1 chunk
    storePDFStream.once('data', chunk => (response = chunk));

    // pump stuff around
    pump(
      mustacheToLaTeX,
      LaTeXtoPDF,
      storePDFStream,
      err => next(err, response)
    );
  });
};
