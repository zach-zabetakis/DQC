var _       = require('lodash');
var helpers = require(__dirname + '/../lib/helpers');
var lottery = require(__dirname + '/../lib/lottery');

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

  var scenarios = DQC.scenario.scenarios;

  _.each(scenarios, function (scenario) {
    var message;

    DQC.out(helpers.format(scenario.name, true, true));
    DQC.out(helpers.format('Location: ' + scenario.location, true, true));

    if (scenario.in_battle) {

    } else {
      // What out of battle actions can be automated...?
    }

    DQC.out();

    // output status line
    _.each(scenario.characters.groups, outputStatusLines);
    _.each(scenario.allies.groups, outputStatusLines);
    if (scenario.in_battle) {
      var remaining = [];
      _.each(scenario.enemies.groups, function (group) {
        // groups can only contain a single species of enemy
        var firstEnemyName = (group.members[0] && group.members[0].name) || 'Missingno';
        var enemyLetters   = '';

        _.each(group.members, function (member, index) {
          if (member.curr_HP > 0) {
            enemyLetters += String.fromCharCode(65 + index);
          }
        });

        if (enemyLetters) {
          remaining.push(firstEnemyName + enemyLetters);
        }
      });
      DQC.out(helpers.format('[' + remaining.join(', ') + ' remain. Command?]', false, true));

    } else {
      DQC.out(helpers.format('[Command?]', false, true));
    }

  });

  DQC.out();
  DQC.out('----------');
  DQC.out();
  DQC.out('CURRENT BALL OF LIGHT JACKPOT: ' + helpers.format(DQC.scenario.jackpot, true));


  // outputs current HP/MP values of the group provided
  function outputStatusLines (group) {
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
};
