/**
 * Specifies configuration for the http interface
 * @type {Object}
 */
exports.http = {
  server: {
    handler: 'hapi',
    port: 3000,
  },
  router: {
    enabled: true,
  },
};
