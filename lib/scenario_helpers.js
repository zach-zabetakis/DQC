var battleHelpers = require(__dirname + '/battle_helpers');
var formulas      = require(__dirname + '/formulas');
var helpers       = require(__dirname + '/helpers');
var _             = require('lodash');

module.exports = {
  createBattleFormation : createBattleFormation,
  createNewScenario     : createNewScenario,
  outputStatusLines     : outputStatusLines,
  warp                  : warp
};

// creates a battle formation for a scenario
// all scenarios must have a formation at all times (to output status line)
function createBattleFormation (scenario) {
  scenario.characters = _.sortBy(scenario.characters, formulas.survival);
  scenario.allies     = _.sortBy(scenario.allies, formulas.survival);

  scenario.battle.characters = {
    groups : createGroups(scenario.characters)
  };

  scenario.battle.allies = {
    groups : createGroups(scenario.allies)
  };

  // snake through list of members to create equally sized groups
  // that are somewhat balanced by survival ability
  function createGroups(members) {
    var groups = [];
    var count  = Math.ceil(members.length / 4);

    for (var i = 0; i < members.length; i++) {
      var position    = i % count;
      var direction   = parseInt(i / count) % 2;
      var group_index = direction ? (count - position - 1) : position;

      if (Array.isArray(groups[group_index])) {
        groups[group_index].push(members[i]);
      } else {
        groups[group_index] = [members[i]];
      }
    }

    groups = _.map(groups, battleHelpers.createNewGroup);

    return groups;
  }
}

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
    battle            : {
      turn       : null,
      characters : {},
      allies     : {},
      enemies    : {}
    }
  });

  return scenario;
}

function outputStatusLines (DQC, scenario) {
  var enemy_status;
  var all;
  var fronts;

  if (scenario.in_battle && scenario.battle.has_fronts) {
    fronts = battleHelpers.separateIntoFronts(scenario);
    all = _.remove(fronts, { front : 'ALL' }).shift();

    _.each(fronts, function (front) {
      DQC.out(helpers.format(front.front + ' Front', true));
      _.each(front.characters, outputAllyStatus);
      _.each(front.allies, outputAllyStatus);
      if (front.enemies.length) {
        enemy_status = outputEnemyStatus(front.enemies);
        DQC.out(helpers.format('[' + enemy_status.join(', ') + ' remain. Command?]', false, true));
      }
      DQC.out();
    });

    if (all) {
      DQC.out(helpers.format('All Fronts', true));
      _.each(all.characters, outputAllyStatus);
      _.each(all.allies, outputAllyStatus);
      enemy_status = outputEnemyStatus(all.enemies);
      DQC.out(helpers.format('[' + enemy_status.join(', ') + ' remain. Command?]', false, true));
    }

  } else if (scenario.in_battle) {
    _.each(scenario.battle.characters.groups, outputAllyStatus);
    _.each(scenario.battle.allies.groups, outputAllyStatus);
    enemy_status = outputEnemyStatus(scenario.battle.enemies.groups);
    DQC.out(helpers.format('[' + enemy_status.join(', ') + ' remain. Command?]', false, true));

    // display characters that are no longer in the battle
    var out_of_battle = _.filter(scenario.characters, { in_battle : false });
    if (out_of_battle.length) {
      DQC.out();
      DQC.out(helpers.format('Location: outside battle', true));
      outputAllyStatus({ members : out_of_battle });
    }

  } else {
    _.each(scenario.battle.characters.groups, outputAllyStatus);
    _.each(scenario.battle.allies.groups, outputAllyStatus);
    DQC.out(helpers.format('[Command?]', false, true));
  }

  // outputs current HP/MP values of the group provided
  function outputAllyStatus (group) {
    var members = _.map(group.members, function (member) {
      var message = member.displayName() + ': ';
      message += 'HP ' + member.curr_HP + '/' + member.max_HP + ', ';
      message += 'MP ' + member.curr_MP + '/' + member.max_MP;
      message += helpers.displayStatus(member.status);
      message += '.';
      return message;
    });
    DQC.out(helpers.format('[' + members.join(' ') + ']', false, true));
  }

  // outputs the names of the remaining foes in battle
  function outputEnemyStatus (enemies) {
    var remaining = _.map(enemies, function (group) {
      // groups can only contain a single species of enemy
      var firstEnemyName = (group.members[0] && group.members[0].name) || 'Missingno';
      var enemySymbols   = '';
      var display_group  = false;

      _.each(group.members, function (member) {
        if (!member.is_dead) {
          enemySymbols += member.symbol || '';
          display_group = true;
        }
      });

      if (display_group) {
        return (firstEnemyName + enemySymbols);
      }
    });

    return _.compact(remaining);
  }
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

        createBattleFormation(new_scenario);

        DQC.scenario.scenarios.splice(++scenario_index, 0, new_scenario);
      });
    }

  } else if (allies.length) {
    // noop: allies warping will disappear without characters accompanying them
  }
}
