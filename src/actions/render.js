const Promise = require('bluebird');
const mustache = require('mustache');
const upload = require('../utils/upload');

/**
 * Renders LaTeX template and stores it based on the passed configuratio.n
 * @param  {MserviceRequest} data - Incoming request.
 * @param  {Object} data.params - Input payload for the request.
 * @param  {string} data.params.template - Name of a template to render.
 * @param  {Object} data.params.context - Context.
 * @param  {(Object|boolean)} data.params.meta - Document configuration for @microfleet/files.
 * @returns {Promise<*>} Data with file location.
 */
module.exports = async function render({ params }) {
  const template = this.config.pdfPrinter.getTemplate(params.template);

  // render template to html
  const html = mustache.render(template, params.context);

  // print out pdf
  const pdf = await this.chrome.printToPdf(html, params.documentOptions);

  // just return base64 data back
  if (params.meta === false) {
    return pdf;
  }

  // upload
  return Promise
    .bind(this, [params.meta, pdf])
    .spread(upload)
    .get('uploadId');
};
