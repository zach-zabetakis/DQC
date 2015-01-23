var sim   = require(process.cwd() + '/sim');
var async = require('async');

module.exports = function (DQC) {
  async.waterfall([
    sim.random,
    sim.init,
    sim.calculate
  ], function (error, results) {
    if (error) {
      throw new Error('CURSED!');
    }

    DQC.data = results;
  });
};
