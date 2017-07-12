const crypto = require('crypto');
const request = require('request-promise');
const retry = require('bluebird-retry');

/**
 * Converts base64 string to Buffer
 * @param {String} source Source base64-encoded string
 * @returns {Buffer}
 */
const base64ToBuffer = source => Buffer.from(source, 'base64');

/**
 * Calculate a md5 hash of the provided string
 * @param {*} source
 * @returns {String}
 */
const contentHash = source => crypto.createHash('md5')
  .update(source)
  .digest('base64');

// retry on following status codes
// https://cloud.google.com/storage/docs/exponential-backoff
const isRetrieble = /^(403|429|5\d\d)$/;
const testError = error => isRetrieble.test(error.responseCode);

/**
 * Upload a document to cloud with optional retry
 * @param {Object} payload Upload options, see available on https://github.com/request/request
 * @param {Object} retryOptions Retry options, see available on https://github.com/demmer/bluebird-retry
 * @returns {Promise<Object>}
 */
const upload = (payload, retryOptions = { disabled: true }) => {
  const uploader = () => request.put(payload);

  if (retryOptions.disabled) {
    return uploader();
  }

  const options = {
    ...retryOptions,
    predicate: testError,
  };

  return retry(uploader, options);
};

/**
 * Initiate signed url upload and perform it
 * @param {Object} metadata Document metadata
 * @param {String} document base64-encoded pdf file
 * @returns {Promise<Object>}
 */
module.exports = function uploadFile(metadata, document) {
  const { amqp, config: { files, pdfPrinter } } = this;

  const body = base64ToBuffer(document);
  const hash = contentHash(body);
  const contentLength = body.length;

  const message = {
    ...metadata,
    files: [{
      type: 'arbitrary',
      contentLength,
      contentType: 'application/pdf',
      md5Hash: Buffer.from(hash, 'base64').toString('hex'),
    }],
    resumable: false,
    uploadType: 'pdf',
  };

  // init signed url upload
  return amqp.publishAndWait(files.upload.route, message, { timeout: files.upload.timeout })
    .tap((fileData) => {
      // is public?
      const isPublic = fileData.public;

      // we always have only 1 file
      const [file] = fileData.files;

      // prepare headers for upload
      const headers = {
        'Content-MD5': hash,
        'Cache-Control': isPublic ? 'public,max-age=31536000' : 'private,max-age=0',
        'Content-Type': 'application/pdf',
        'Content-Length': contentLength,
      };

      // add extra pub header
      if (isPublic) headers['x-goog-acl'] = 'public-read';

      const payload = {
        url: file.location,
        body,
        headers,
        resolveWithFullResponse: true,
      };

      // upload to google
      return upload(payload, pdfPrinter.retryOptions);
    });
};
