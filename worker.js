var prompt = require(__dirname + '/prompt');
var sim    = require(__dirname + '/sim');
var async  = require('async');
var nconf  = require('nconf');
var fs     = require('fs');

module.exports = function () {
  async.waterfall([
    sim.random,
    sim.init,
    sim.calculate,
    sim.populate,
    sim.commands,
  ], function (error, results) {
    if (error) {
      throw error || new Error('CURSED!');
    }

    // store all data together
    var file = nconf.get('file');
    var DQC  = {};

    DQC.RNG  = results.RNG;
    delete results.RNG;

    DQC.scenario = results.scenario;
    delete results.scenario;

    DQC.data = results;

    // set up an output function
    if (file) {
      DQC.file = fs.createWriteStream(file, { encoding : 'utf8' });
      DQC.out = function (message) {
        message = message || '';
        console.log(message);

        message = message ? (message + "\n") : "\n";
        DQC.file.write(message);
      };
      DQC.close = function () {
        DQC.file.end();
      }
    } else {
      DQC.out = function (message) {
        message = message || '';
        console.log(message);
      };
      DQC.close = function () {};
    }

    // run the update
    sim.update(DQC);

    DQC.close();

    // save the update
    prompt('Save results? (yes/no): ', function (input) {
      if (input === 'yes') {
        sim.save(DQC, function () {
          process.exit();
        });
      } else {
        process.exit();
      }

    });
  });
};
