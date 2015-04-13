var battleHelpers = require(__dirname + '/../lib/battle_helpers');
var _             = require('lodash');

/*
 * Verify/Sanitize commands and attach them to the appropriate member.
 */
module.exports = function (data, next) {
  _.each(data.command, function (command) {
    // Make sure command is valid
    var validCommands = ['ATTACK', 'CHARGE', 'HEART', 'ITEM', 'NONE', 'PARRY', 'RETREAT', 'RUN', 'SHIFT', 'SPELL'];
    if (!_.includes(validCommands, command.type)) {
      throw new Error('Command ' + command.type + ' is not valid.');
    }

    // Make sure member type and target type is valid
    var validTypes = ['characters', 'allies', 'enemies'];
    if (command.member.type && !_.includes(validTypes, command.member.type)) {
      throw new Error('Member type ' + command.member.type +  ' invalid. Must be one of ' + validTypes.join(', ') + '.');
    }
    if (command.target.type && !_.includes(validTypes, command.target.type)) {
      throw new Error('Target type ' + command.target.type +  ' invalid. Must be one of ' + validTypes.join(', ') + '.');
    }

    // Make sure character/npc/monster can be found
    var member;
    _.each(data.scenario.scenarios, function (scenario) {
      member = battleHelpers.findMember(scenario, command.member.name, command.member.type);
      if (member) {
        return false;
      }
    });
    if (member) {
      member.command = command;
    } else {
      throw new Error(command.member.type + ' named ' + command.member.name + ' not found.');
    }

    // Make sure target is valid
    var target;
    if (command.target.name) {
      _.each(data.scenario.scenarios, function (scenario) {
        target = battleHelpers.findMember(scenario, command.target.name, command.target.type);
        if (target) {
          return false;
        }
      });
      if (target) {
        // TODO: attach target
      } else {
        throw new Error(command.target.type + ' named ' + command.target.name + ' not found.');
      }
    }
  });

  return next(null, data);
}
