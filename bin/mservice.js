#!/usr/bin/env node

let dir;
try {
  require('babel-register');
  dir = '../src';
} catch (e) {
  dir = '../lib';
}

// eslint-disable-next-line import/no-dynamic-require
const Service = require(dir);
const service = new Service();

service.connect()
  .then(function serviceStarted() {
    return service.log.info('service started');
  })
  .catch(function serviceCrashed(err) {
    service.log.fatal('service crashed', err);
    setImmediate(() => { throw err; });
  });
