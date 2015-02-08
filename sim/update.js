var _       = require('lodash');
var helpers = require(process.cwd() + '/lib/helpers');
var lottery = require(process.cwd() + '/lib/lottery');

module.exports = function (DQC) {
  helpers.out('~UPDATE!~', true, true);
  helpers.out('');
  helpers.out('');

  // LOTTERY
  helpers.out('OFFICIAL LOTTERY DRAWINGS', true);
  helpers.out('');
  lottery.loto3(DQC.RNG, DQC.data.character);
  helpers.out('');
  lottery.bol(DQC.RNG, DQC.data.character);
  helpers.out('');

  var scenarios = DQC.scenario.scenarios;

  _.each(scenarios, function (scenario) {
    var message;

    helpers.out(scenario.name, true, true);
    helpers.out('Location: ' + scenario.location, true, true);

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
      helpers.out('[' + remaining.join(', ') + ' remain. Command?]', false, true)

    } else {
      helpers.out('[Command?]', false, true);
    }

  });
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
  helpers.out('[' + members.join(' ') + ']', false, true);
}
