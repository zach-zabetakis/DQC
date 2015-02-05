var worker = require(process.cwd() + '/worker');
var nconf  = require('nconf');
require(process.cwd() + '/lib/lodash_mixins');

nconf.argv({
  'd' : {
    alias    : 'data',
    describe : 'Location of the data files',
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
nconf.file('config.json', process.cwd() + '/config.json');
nconf.file('package.json', process.cwd() + '/package.json');

// Hand off to the worker
worker();
