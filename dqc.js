console.log('UPDATE~!');

var worker = require(process.cwd() + '/worker');
var nconf  = require('nconf');
require(process.cwd() + '/lib/lodash_mixins');

// GLOBAL SIMULATOR OBJECT
var DQC = {};

nconf.argv({
  'd' : {
    alias    : 'data',
    describe : 'Location of the data files',
    demand   : false
  }
}, 'Usage: $0');
nconf.env();
nconf.file('config.json', process.cwd() + '/config.json');
nconf.file('package.json', process.cwd() + '/package.json');

// Hand off to the worker
worker(DQC);
