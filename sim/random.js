var Random = require('random-js');

/*
 * Auto seed the almighty Random Number Generator.
 */
module.exports = function (next) {
  var rng = new Random(Random.engines.mt19937().autoSeed());

  return next(null, rng);
};
