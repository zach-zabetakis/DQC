var _ = require('lodash');

module.exports = {
  generateTurnOrder : generateTurnOrder
};

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
