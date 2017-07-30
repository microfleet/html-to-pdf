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
module.exports = function render({ params }) {
  const template = this.config.pdfPrinter.getTemplate(params.template);

  // render template to html
  const html = mustache.render(template, params.context);
  const meta = params.meta;

  // print pdf
  return this.chrome
    .printToPdf(html, params.documentOptions)
    .then(pdf => (
      meta === false
        ? pdf
        : upload.call(this, meta, pdf).get('uploadId')
    ));
};
