const Promise = require('bluebird');
const mu2 = require('mu2');
const bl = require('bl');
const upload = require('../utils/upload');

const bufferToString = buffer => buffer.toString();
/**
 * Renders LaTeX template and stores it based on the passed configuration
 * @param  {MserviceRequest} data - Incoming request.
 * @param  {Object} data.params - Input payload for the request.
 * @param  {String} data.params.template - Name of a template to render
 * @param  {Object} data.params.context - Context
 * @param  {Object} data.params.meta - Document metadata. https://github.com/makeomatic/ms-files/blob/master/schemas/common.json#L190
 * @returns {Promise<*>} data with file location.
 */
module.exports = function render({ params }) {
  const template = this.config.pdfPrinter.getTemplate(params.template);

  // render template to html
  const html = Promise.fromCallback(callback => (
    mu2.render(template, params.context).pipe(bl(callback))
  ));

  const uploader = upload.bind(this, params.meta);

  return html
    .then(bufferToString)
    .then(text => this.chrome.printToPdf(text, params.documentOptions))
    .then(uploader);
};
