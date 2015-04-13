var _             = require('lodash');
var battleHelpers = require(__dirname + '/../lib/battle_helpers');
var helpers       = require(__dirname + '/../lib/helpers');
var lottery       = require(__dirname + '/../lib/lottery');

module.exports = function (DQC) {
  DQC.out(helpers.format('~UPDATE!~', true, true));
  DQC.out();
  DQC.out();

  // LOTTERY
  var loto3 = lottery.loto3(DQC);
  var bol   = lottery.bol(DQC);

  if (loto3.length || bol.length) {
    DQC.out(helpers.format('OFFICIAL LOTTERY DRAWINGS', true));
    if (loto3.length) {
      DQC.out();
      _.each(loto3, DQC.out);
    }
    if (bol.length) {
      DQC.out();
      _.each(bol, DQC.out);
    }
    DQC.out();
  }

  // Update each individual scenario
  _.each(DQC.scenario.scenarios, function (scenario) {
    if (scenario.update) {
      var message;

      DQC.out(helpers.format(scenario.name, true, true));
      DQC.out(helpers.format('Location: ' + scenario.location, true, true));
      DQC.out();

      if (scenario.in_battle) {
        // Each participant in battle will take turns in a randomly generated order.
        battleHelpers.generateTurnOrder(DQC, scenario);

        // Enemy units choose a target at the beginning of each turn
        // TODO: some (all?) enemies choose actions at the beginning of each turn
        _.each(scenario.battle.enemies.groups, function (group) {
          _.each(group.members, function (enemy) {
            if (enemy.can_act && !battleHelpers.isIncapacitated(enemy)) {
              enemy.target = battleHelpers.chooseEnemyTarget(DQC, scenario, enemy);
            }
          });
        });

        // TODO: set flag for PARRY

        _.each(scenario.battle.turn_order, function (active_member) {
          var disp_name = active_member.name + (active_member.symbol || '');

          switch (active_member.type) {
            case 'character' :
              battleHelpers.simulateCharacterTurn(DQC, scenario, active_member);
              break;
            case 'npc' :
              battleHelpers.simulateNPCTurn(DQC, scenario, active_member);
              break;
            case 'monster' :
              battleHelpers.simulateMonsterTurn(DQC, scenario, active_member);
              break;
            default :
              throw new Error('Unknown type ' + type);
              break;
          }

          // check if the battle has ended
          if (!battleHelpers.isRemaining(scenario, 'characters')) {
            scenario.in_battle = false;
            DQC.out();
            if (battleHelpers.isPlayerWipeout) {
              battleHelpers.wipeout(DQC, scenario);

            } else {
              // TODO: one or more players fled or did not participate in battle.
            }

            // exit out of the turn order
            return false;

          } else if (!battleHelpers.isRemaining(scenario, 'enemies')) {
            scenario.in_battle = false;
            DQC.out();
            if (!scenario.battle.enemies.groups.length) {
              DQC.out('There are no more enemies remaining.');
              // TODO: all enemies fled or were expelled from battle.

            } else {
              battleHelpers.victory(DQC, scenario);
            }

            // exit out of the turn order
            return false;
          }
        });

      } else {
        // What out of battle actions can be automated...?
      }

      DQC.out();

      // output status lines
      _.each(scenario.battle.characters.groups, outputAllyStatus);
      _.each(scenario.battle.allies.groups, outputAllyStatus);
      if (scenario.in_battle) {
        var enemy_status = outputEnemyStatus(scenario.battle.enemies);
        DQC.out(helpers.format('[' + enemy_status.join(', ') + ' remain. Command?]', false, true));

      } else {
        DQC.out(helpers.format('[Command?]', false, true));
      }
      
      DQC.out();
    }
  });

  DQC.out('----------');
  DQC.out();
  DQC.out('CURRENT BALL OF LIGHT JACKPOT: ' + helpers.format(DQC.scenario.jackpot, true));


  // outputs current HP/MP values of the group provided
  function outputAllyStatus (group) {
    var members = _.map(group.members, function (member) {
      var message = member.name + ': ';
      message += 'HP ' + member.curr_HP + '/' + member.max_HP + ', ';
      message += 'MP ' + member.curr_MP + '/' + member.max_MP;
      if (member.status.length) {
        message += ' ' + member.status.join(',');
      }
      message += '.';
      return message;
    });
    DQC.out(helpers.format('[' + members.join(' ') + ']', false, true));
  }

  // outputs the names of the remaining foes in battle
  function outputEnemyStatus (enemies) {
    var remaining = _.map(enemies.groups, function (group) {
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
};
