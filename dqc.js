console.log('UPDATE~!');

var sim = require(process.cwd() + '/sim');

// GLOBAL SIMULATOR OBJECT
var DQC = {};

/*
 * Initialize saved data
 */
sim.init(function (error, data) {
  if (error) {
    console.log('CURSED! Could not init data');
  } else {
    DQC.data = data;
  }
});

