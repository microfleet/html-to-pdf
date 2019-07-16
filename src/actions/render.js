const mustache = require('mustache');
const { ActionTransport } = require('@microfleet/core');
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
async function render({ params }) {
  this.log.debug({ params }, 'preparing to render template');
  const { meta, context, documentOptions } = params;
  const template = this.config.pdfPrinter.getTemplate(params.template);

  // render template to html
  const html = mustache.render(template, context);
  const pdf = await this.chrome.printToPdf(html, documentOptions);

  if (meta === false) {
    return pdf;
  }

  return upload.call(this, meta, pdf).get('uploadId');
}

module.exports = render;
render.transports = [ActionTransport.amqp];
