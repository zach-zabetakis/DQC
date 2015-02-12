var worker = require(__dirname + '/worker');
var nconf  = require('nconf');
require(__dirname + '/lib/lodash_mixins');

nconf.argv({
  'd' : {
    alias    : 'data',
    describe : 'Location of the data files',
    demand   : false
  },
  'f' : {
    alias    : 'file',
    describe : 'Location of output file',
    demand   : false
  },
  'h' : {
    alias    : 'html',
    describe : 'HTML markup in output?',
    demand   : false
  },
  's' : {
    alias    : 'scenario',
    describe : 'Current scenario to load',
    demand   : false
  }
}, 'Usage: $0');
nconf.env();
nconf.file('config.json', __dirname + '/config.json');
nconf.file('package.json', __dirname + '/package.json');

// Hand off to the worker
worker();
