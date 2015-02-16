var _ = require('lodash');

module.exports = {
  checkHP             : checkHP,
  chooseEnemyTargets  : chooseEnemyTargets,
  expelFromBattle     : expelFromBattle,
  generateTurnOrder   : generateTurnOrder,
  simulateMonsterTurn : simulateMonsterTurn
};

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

// For each enemy in battle, select a single target from the opposing side.
// This target will be used for a flee check, and for default physical attacks.
function chooseEnemyTargets (DQC, scenario) {

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
  if (monster.is_enemy) {
    // if target STR >= monster attack * 2, the monster will flee at a 25% rate
    if ((monster.attack * 2) <= target.adj_strength) {
      if (DQC.RNG.integer(0, 255) % 4 === 0) {
        DQC.out(disp_name + ' is running away.');
        expelFromBattle(scenario, monster);
      }
    }
  }  
}
