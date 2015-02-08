var _       = require('lodash');
var helpers = require(process.cwd() + '/lib/helpers');
var lottery = require(process.cwd() + '/lib/lottery');

module.exports = function (DQC) {
  helpers.out(helpers.format('~UPDATE!~', true, true));
  helpers.out('');
  helpers.out('');

  // LOTTERY
  var loto3 = lottery.loto3(DQC);
  var bol   = lottery.bol(DQC);

  if (loto3.length || bol.length) {
    helpers.out(helpers.format('OFFICIAL LOTTERY DRAWINGS', true));
    if (loto3.length) {
      helpers.out('');
      _.each(loto3, helpers.out);
    }
    if (bol.length) {
      helpers.out('');
      _.each(bol, helpers.out);
    }
    helpers.out('');
  }

  var scenarios = DQC.scenario.scenarios;

  _.each(scenarios, function (scenario) {
    var message;

    helpers.out(helpers.format(scenario.name, true, true));
    helpers.out(helpers.format('Location: ' + scenario.location, true, true));

    if (scenario.in_battle) {

    } else {
      // What out of battle actions can be automated...?
    }

    helpers.out('');

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
      helpers.out(helpers.format('[' + remaining.join(', ') + ' remain. Command?]', false, true));

    } else {
      helpers.out(helpers.format('[Command?]', false, true));
    }

  });

  helpers.out('');
  helpers.out('----------');
  helpers.out('');
  helpers.out('CURRENT BALL OF LIGHT JACKPOT: ' + helpers.format(DQC.scenario.jackpot, true));
};

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
  helpers.out(helpers.format('[' + members.join(' ') + ']', false, true));
}
