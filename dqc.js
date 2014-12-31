console.log('UPDATE~!');

var nconf = require('nconf');
var sim   = require(process.cwd() + '/sim');

// GLOBAL SIMULATOR OBJECT
var DQC = {};

nconf.env();
nconf.file('config.json', process.cwd() + '/config.json');
nconf.file('package.json', process.cwd() + '/package.json');

/*
 * Initialize saved data
 */
sim.init(function (error, data) {
  if (error) {
    throw new Error('CURSED! Could not init data');
  }

  DQC.data = data;
});

