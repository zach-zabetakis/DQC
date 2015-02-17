var _ = require('lodash');

module.exports = {
  canAct              : canAct,
  checkHP             : checkHP,
  chooseEnemyTarget   : chooseEnemyTarget,
  expelFromBattle     : expelFromBattle,
  generateTurnOrder   : generateTurnOrder,
  simulateMonsterTurn : simulateMonsterTurn
};

// check if a member is able to take a turn in battle
function canAct (member) {
  // cannot act if dead, fear, numb, or sleep
  var canAct = !_.intersection(member.status, ['DE', 'FR', 'NU', 'SL']).length;
  return canAct;
}

// check that current HP is in bounds and set flags if dead
function checkHP (member) {
  // curr_HP cannot be greater than max_HP
  member.curr_HP = Math.min(member.curr_HP, member.max_HP);
  member.curr_HP = Math.max(member.curr_HP, 0);

  if (member.curr_HP === 0) {
    member.is_dead = true;
    member.status  = _.union(member.status, ['DE']);
  } else {
    member.is_dead = false;
    member.status  = _.difference(member.status, ['DE']);
  }
}

// For a given enemy, select a single target from the opposing side.
// This target will be used for a flee check, and for default physical attacks.
function chooseEnemyTarget (DQC, scenario, enemy) {
  var group_options  = [];
  var member_options = [];
  var selected_group;
  var target_type;
  var target;

  // ally units only have a 25% chance of being targeted (compared to characters)
  if (scenario.allies.active && DQC.RNG.integer(0, 255) % 4 === 0) {
    target_type = 'allies';
  } else {
    target_type = 'characters';
  }

  // select the group to target (equal chance between each active group)
  _.each(scenario[target_type].groups, function (group, index) {
    if (group.active) {
      group_options.push(index);
    }
  });

  if (group_options.length) {
    selected_group = group_options[DQC.RNG.integer(0, group_options.length -1)];
    selected_group = scenario[target_type].groups[selected_group];
  } else {
    throw new Error('No active ' + target_type + ' groups to select for scenario ' + scenario.name);
  }

  // select the member in the group to target (weighted by formation)
  _.each(selected_group.members, function (member, index) {
    if (!member.is_dead) {
      member_options.push(index);
    }
  });

  if (member_options.length) {
    target = DQC.RNG.integer(1, 16);
    switch (member_options.length) {
      case 1:
        target = member_options[0];
        break;
      case 2:
        target = (target <= 10) ? member_options[0] : member_options[1];
        break;
      case 3:
        target = (target <= 8) ? member_options[0]
               : (target <= 13) ? member_options[1] : member_options[2];
        break;
      case 4:
        target = (target <= 7) ? member_options[0]
               : (target <= 11) ? member_options[1]
               : (target <= 14) ? member_options[2] : member_options[3];
        break;
      default:
        throw new Error('Invalid party size of ' + member_options.length + ' for scenario ' + scenario.name);
        break;
    }
    target = selected_group.members[target];
  } else {
    throw new Error('No targetable members in ' + target_type + ' group for scenario ' + scenario.name);
  }

  return target;
}

// remove the selected member from the battle scenario
function expelFromBattle (scenario, member) {

}

// loop through all participants in battle and generate a random turn order
function generateTurnOrder (DQC, scenario) {
  var turn_order = [];

  // loop over enemies first so that ties will go to allies/characters instead.
  _.each(scenario.enemies.groups, rollForInitiative);
  _.each(scenario.allies.groups, rollForInitiative);
  _.each(scenario.characters.groups, rollForInitiative);
  turn_order = _.sortBy(turn_order, 'order').reverse();

  scenario.turn_order = turn_order;

  // calculates agility scores based on the curr_agility of each member in the group
  function rollForInitiative (group) {
    var agi, agi_score, name;

    _.each(group.members, function (member) {
      agi  = member.curr_agility;
      name = member.name + (member.symbol || '');
      // there must be a will to fight!
      if (member.curr_HP > 0) {
        if (agi === 0) {
          agi_score = DQC.RNG.integer(0, 1);
        } else {
          // AGI - (rand(0, 255) * (AGI - (AGI / 4)) / 256)
          agi_score = agi - parseInt((DQC.RNG.integer(0, 255) * (agi - parseInt(agi / 4, 10))) / 256, 10);
        }

        member.order = parseInt(agi_score, 10);
        turn_order.push(member);
      }
    });
  }
}

// simulate a single monster's turn in battle
function simulateMonsterTurn (DQC, scenario, monster) {
  var disp_name = monster.name + (monster.symbol || '');
  var target    = monster.target || {};

  // Perform a flee check for enemy monsters.
  if (monster.is_enemy && canAct(monster)) {
    // if target STR >= monster attack * 2, the monster will flee at a 25% rate
    if ((monster.attack * 2) <= target.adj_strength) {
      if (DQC.RNG.integer(0, 255) % 4 === 0) {
        DQC.out(disp_name + ' is running away.');
        expelFromBattle(scenario, monster);
        return;
      }
    }
  }

  DQC.out(disp_name + ' stares blankly at ' + target.name + '!');
}
