var battleHelpers = require(__dirname + '/../lib/battle_helpers');
var _             = require('lodash');

module.exports = {
  chooseCommand : chooseCommand,
  chooseTarget  : chooseTarget
};

// choose a command based on all available factors
function chooseCommand (DQC, scenario, member) {
  // bypass circular dependency issue with dependency injection
  var Commands = require(__dirname + '/../lib/commands')(battleHelpers);

  var random1 = [125, 125, 125, 125, 125, 125, 125, 125];
  var random2 = [220, 200, 180, 160, 90, 70, 50, 30];
  var random3 = _.clone(random2).reverse();
  var pattern = member.pattern || [];
  var isValid = false;
  var attempt = 0;
  var number;
  var action;
  var target;
  var index;

  function selectPattern (probability, index) {
    number -= probability;
    if (number <= 0) {
      action = pattern[index];
      return false;
    }
  }

  // Try up to 8 times to produce a valid command
  // Else default to a physical attack
  while (!isValid) {
    number = DQC.RNG.integer(1, 1000);
    attempt++;

    if (attempt > 8) {
      action = 'ATTACK';
      break;
    }

    switch (member.behavior) {
      case 'custom':
        // TODO: run custom AI function based on name
        action = 'NONE';
        break;
      case 'fixed':
        // loop through pattern array sequentially
        index  = ((scenario.battle.turn + attempt - 1) % pattern.length) || 0;
        action = pattern[index];
        break;
      case 'random1':
        // each move has an equal chance to be picked
        _.each(random1, selectPattern);
        break;
      case 'random2':
        // pattern array is weighted from more to less likely
        _.each(random2, selectPattern);
        break;
      case 'random3':
        // patern array is weighted, but is reversed if HP is low
        if (member.curr_HP * 4 <= member.max_HP) {
          _.each(random3, selectPattern);
        } else {
          _.each(random2, selectPattern);
        }
        break;
      case 'none':
      default:
        // no command is chosen, no action is taken
        action = 'NONE';
        break;
    }

    // TODO: choose target
    //target = member.target;
    target = chooseTarget(DQC, scenario, member, action);

    // TODO: validate command
    isValid = true;
  }

  if (action) {
    action = action.split(':');
    member.command = {
      type     : action[0],
      name     : action[1],
      member   : member,
      target   : target
    };

  } else {
    member.command = {
      type     : 'NONE',
      member   : member,
      target   : {},
    };
  }

  Commands.setPriority(DQC.data, member.command);
}


function chooseTarget (DQC, scenario, member, action) {
  action = action.split(':');
  var type = action[0];
  var name = action[1];
  var target = member.target || {};

  switch (type) {
    case 'ATTACK':
      if (member.is_enemy) {
        target = member.target || battleHelpers.chooseEnemyTarget(DQC, scenario, enemy, member.front);
        member.target = target;
      } else {
        // TODO: pick weakest target remaining
      }
      break;
    case 'SKILL':
      // TODO: determine appropriate target for this skill
      break;
    case 'SPELL':
      // TODO: determine appropriate target for this spell
      break;
    case 'NONE':
    case 'PARRY':
    case 'RUN':
      // these actions have no target
      target = {};
      break;
    case 'CHARGE':
    case 'HEART':
    case 'ITEM':
    case 'RETREAT':
    case 'SHIFT':
    default:
      // these actions should not be able to be selected by the AI
      throw new Error('Command type ' + type + ' is not valid for meber ' + member.displayName() + '.');
      break;
  }

  return target;
}
