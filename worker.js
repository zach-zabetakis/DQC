var sim   = require(__dirname + '/sim');
var async = require('async');

module.exports = function () {
  async.waterfall([
    sim.random,
    sim.init,
    sim.calculate
  ], function (error, results) {
    if (error) {
      throw new Error('CURSED!');
    }

    var DQC = {};

    DQC.RNG  = results.RNG;
    delete results.RNG;

    DQC.scenario = results.scenario;
    delete results.scenario;

    DQC.data = results;

    // run the update
    sim.update(DQC);
  });
};
