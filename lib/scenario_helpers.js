var _ = require('lodash');

module.exports = {
  createNewScenario : createNewScenario,
  warp              : warp
};

// creates a new scenario with any default values passed in
function createNewScenario (defaults) {
  var scenario = _.defaults(defaults, {
    update            : false,
    name              : 'New Scenario',
    location          : '',
    map_position      : null,
    is_indoors        : false,
    light_level       : null,
    characters        : [],
    allies            : [],
    in_quest          : false,
    quest             : null,
    in_battle         : false,
    battles_remaining : null,
    battle            : {}
  });

  return scenario;
}

// check for characters/allies that are warping out of this scenario
// if everyone in the scenario is warping, change current scenario instead
function warp (DQC, scenario_index) {
  var scenario   = DQC.scenario.scenarios[scenario_index];
  var characters = _.remove(scenario.characters, function (c) { return c.warp });
  var allies     = _.remove(scenario.allies, function (a) { return a.warp });
  var members    = characters.concat(allies);
  var locations  = [];

  if (characters.length) {
    // determine how many different warp locations we have
    _.each(members, function (member) {
      if (locations.indexOf(member.warp) === -1) {
        locations.push(member.warp);
      }
    });

    // special case: everyone is warping to the same location
    // Keep the current scenario for convenience
    if (!scenario.characters.length && locations.length === 1) {
      scenario.characters = characters;
      scenario.allies = allies;
      scenario.map_position = locations[0];
      scenario.location = 'Somewhere Else';  // TODO: location lookup based on map position
      scenario.is_indoors = false;
      scenario.light_level = null;

    } else {
      // create a new scenario for each warp location
      _.each(locations, function (map_position) {

        var new_scenario = createNewScenario({
          update       : false,
          map_position : map_position,
          location     : 'Somewhere Else',  // TODO: location lookup based on map position
          characters   : _.remove(members, function (m) { return (m.warp === map_position && m.type === 'character') }),
          allies       : _.remove(members, function (m) { return (m.warp === map_position && m.type !== 'character') })
        });

        DQC.scenario.scenarios.splice(++scenario_index, 0, new_scenario);
      });
    }

  } else if (allies.length) {
    // noop: allies warping will disappear without characters accompanying them
  }
}
