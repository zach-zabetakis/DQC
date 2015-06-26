var _ = require('lodash');

module.exports = {
  warp : warp
};

// check for characters/allies that are warping out of this scenario
// if everyone in the scenario is warping, change current scenario instead
function warp (DQC, scenario, scenario_index) {
  var characters = _.remove(scenario.characters, function (c) { return c.warp });
  var allies     = _.remove(scenario.allies, function (a) { return a.warp });

  if (characters.length) {
    // TODO: determine how many different warp locations we have

    if (scenario.characters.length) {
      // TODO: send each different warp location to a new scenario

    } else {
      // TODO: all characters have warped away. Keep the current scenario for convenience
      scenario.characters = characters;
    }
  } else if (allies.length) {
    // allies warping will disappear without characters accompanying them
  }
}
