const digestStream = require('digest-stream');
const through = require('through2');
const pumpify = require('pumpify');
const bl = require('bl');
const request = require('request-promise');

module.exports = function uploadThroughStream(meta) {
  const { amqp, config: { files } } = this;

  let contentLength;
  let hash;
  let contents;

  // calculate md5 hashsum
  const digest = digestStream('md5', 'base64', (_hash, _contentLength) => {
    hash = _hash;
    contentLength = _contentLength;
  });

  // buffer content of the file
  const bufferContent = bl((err, _contentsBuffer) => {
    if (err) return;
    contents = _contentsBuffer;
  });

  // uploading data
  const uploadStream = through.obj(
    (chunk, enc, next) => next(),
    (next) => {
      // flush function
      const message = {
        ...meta,
        files: [{
          type: 'pdf',
          contentLength,
          contentType: 'application/pdf',
          md5Hash: Buffer.from(hash, 'base64').toString('hex'),
        }],
      };

      amqp
        .publishAndWait(files.initUpload.route, message, files.initUpload.timeout)
        .tap((fileData) => {
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

          // upload to google
          return request.put({ url: file.location, body: contents, headers });
        })
        .asCallback(next);
    }
  );

  return pumpify(
    digest,
    bufferContent.duplicate(),
    uploadStream
  );
};
