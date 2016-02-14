var _               = require('lodash');
var battleHelpers   = require(__dirname + '/../lib/battle_helpers');
var AI              = require(__dirname + '/../lib/ai_helpers')(battleHelpers);
var helpers         = require(__dirname + '/../lib/helpers');
var lottery         = require(__dirname + '/../lib/lottery');
var scenarioHelpers = require(__dirname + '/../lib/scenario_helpers');

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
  var scenario_index = 0;
  var scenario;
  while (DQC.scenario.scenarios[scenario_index]) {
    scenario = DQC.scenario.scenarios[scenario_index];

    var message;
    var front;

    DQC.out(helpers.format(scenario.name, true, true));
    DQC.out(helpers.format('Location: ' + scenario.location, true, true));
    DQC.out();

    if (scenario.update) {

      // 1) PRE-BATTLE commands
      if (!scenario.in_battle || scenario.battle.turn === 0) {
        // TODO: all of this
      }

      // 2) BATTLE commands
      if (scenario.in_battle) {
        // Each participant in battle will take turns in a randomly generated order.
        battleHelpers.generateTurnOrder(DQC, scenario);

        // Some enemies choose commands at the beginning of each turn
        _.each(scenario.battle.enemies.groups, function (group) {
          _.each(group.members, function (enemy) {
            if (enemy.can_act && !battleHelpers.isIncapacitated(enemy) && enemy.is_aware === false) {
              AI.chooseCommand(DQC, scenario, enemy);
            }
          });
        });

        // Re-sort turn order based on priority levels of each command
        scenario.battle.turn_order = _.sortBy(scenario.battle.turn_order, function (member) {
          var priority = (member.command && member.command.priority) || 0;
          var order    = (priority * 1000) + member.order;
          return order;
        }).reverse();

        var active_member;
        while (scenario.battle.turn_order.length) {
          active_member = scenario.battle.turn_order.shift();
          if (!active_member.is_dead) {
            switch (active_member.type) {
              case 'character' :
                message = battleHelpers.simulateCharacterTurn(DQC, scenario, active_member);
                DQC.out(message);
                break;
              case 'npc' :
                message = battleHelpers.simulateNPCTurn(DQC, scenario, active_member);
                DQC.out(message);
                break;
              case 'monster' :
                message = battleHelpers.simulateMonsterTurn(DQC, scenario, active_member);
                DQC.out(message);
                break;
              default :
                throw new Error('Unknown type ' + type);
                break;
            }

            // check if the battle has ended
            if (!battleHelpers.isRemaining(scenario, 'characters')) {
              scenario.in_battle = false;
              _.each(scenario.allies, battleHelpers.clearBattleEffects);
              DQC.out();

              if (battleHelpers.isPlayerWipeout(scenario)) {
                battleHelpers.wipeout(DQC, scenario);

              } else {
                // one or more characters fled or were otherwise expelled from battle.
                // allies who were left behind in battle will disappear.
                _.eachRight(scenario.allies, function (member, index) {
                  if (member.in_battle) {
                    battleHelpers.expelFromBattle(scenario, member);
                    scenario.allies.splice(index, 1);
                  }
                });
              }

              // exit out of the turn order
              return false;

            } else if (!battleHelpers.isRemaining(scenario, 'enemies')) {
              scenario.in_battle = false;
              _.each(scenario.characters, battleHelpers.clearBattleEffects);
              _.each(scenario.allies, battleHelpers.clearBattleEffects);
              DQC.out();

              if (!scenario.battle.enemies.groups.length) {
                DQC.out('There are no more enemies remaining.');

              } else {
                battleHelpers.victory(DQC, scenario);
              }

              // exit out of the turn order
              return false;
            }
          }
        }

        // run cleanup function for the current battle state
        battleHelpers.endOfTurn(DQC, scenario);
        // characters/allies who are warping away are sent to a new scenario
        scenarioHelpers.warp(DQC, scenario_index);

        if (!scenario.in_battle) {
          battleHelpers.endOfBattle(DQC, scenario);
          // add characters/allies who fled back to the battle order
          battleHelpers.resetFormation(DQC, scenario);
        }

      }

      // 3) POST-BATTLE commands
      if (!scenario.in_battle) {
        // TODO: all of this
      }
    }

    DQC.out();

    // output status lines
    scenarioHelpers.outputStatusLines(DQC, scenario);
    
    DQC.out();

    scenario_index++;
  };

  DQC.out('----------');
  DQC.out();
  DQC.out('CURRENT BALL OF LIGHT JACKPOT: ' + helpers.format(DQC.scenario.jackpot, true));

};
