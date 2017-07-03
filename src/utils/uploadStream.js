const digestStream = require('digest-stream');
const through = require('through2');
const pumpify = require('pumpify');
const bl = require('bl');
const request = require('request-promise');
// const request = require('request');

// function initUpload(meta, hash, contentLength) {
//   const { amqp, config: { files } } = this;
//   const message = {
//     ...meta,
//     files: [{
//       type: 'pdf',
//       contentLength,
//       contentType: 'application/pdf',
//       md5Hash: Buffer.from(hash, 'base64').toString('hex'),
//     }],
//   };

//   return amqp.publishAndWait(files.initUpload.route, message, files.initUpload.timeout);
// }

// function upload(fileData) {
//   const isPublic = fileData.public;

//   // we always have only 1 file
//   const [file] = fileData.files;

//   // prepare headers for upload
//   const headers = {
//     'Content-MD5': hash,
//     'Cache-Control': isPublic ? 'public,max-age=31536000' : 'private,max-age=0',
//     'Content-Type': 'application/pdf',
//     'Content-Length': contentLength,
//   };

//   // add extra pub header
//   if (isPublic) headers['x-goog-acl'] = 'public-read';

//   // upload to google
//   return request.put({ url: file.location, body: contents, headers });
// }

module.exports = function uploadThroughStream(meta) {
  const { amqp, config: { files } } = this;
  const contents = [];

  let contentLength;
  let hash;

  // calculate md5 hashsum
  const digest = digestStream('md5', 'base64', (_hash, _contentLength) => {
    this.log.debug('calculating hash:', _hash);
    this.log.debug('contentLenght:', _contentLength);

    hash = _hash;
    contentLength = _contentLength;
  });

  // buffer content of the file
  // const bufferContent = bl((err, _contentsBuffer) => {
  //   if (err) {
  //     this.log.error(err);
  //     return;
  //   }

  //   contents = _contentsBuffer;

  //   this.log.debug('content read');
  // });

  // uploading data
  const uploadStream = through(
    (chunk, enc, next) => {
      this.log.info('chunk');
      contents.push(chunk);
      return next(null, chunk);
    },
    (next) => {
      debugger;
      this.log.debug('hash:', hash);
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
          return request.put({ url: file.location, body: Buffer.concat(contents), headers });
        })
        .tapCatch(err => this.log.error(err))
        .asCallback(next);
    }
  );

  return pumpify(
    digest,
    // bufferContent.duplicate(),
    uploadStream
  );
};
