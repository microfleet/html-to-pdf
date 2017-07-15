const conf = require('ms-conf');
const path = require('path');

// default namespace to this
process.env.NCONF_NAMESPACE = process.env.NCONF_NAMESPACE || 'MS_PRINTER';

conf.prependDefaultConfiguration(path.resolve(__dirname, './configs'));

module.exports = conf;
