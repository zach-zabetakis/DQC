var battleHelpers = require(__dirname + '/../lib/battle_helpers');
var _             = require('lodash');

/*
 * Verify/Sanitize commands and attach them to the appropriate member.
 */
module.exports = function (data, next) {
  _.each(data.command, function (command) {
    // Make sure command is valid
    var validCommands = ['ATTACK', 'SPELL', 'ITEM', 'RUN', 'PARRY', 'CHARGE', 'RETREAT', 'SWITCH', 'NONE'];
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
    var member = _.find(data.scenario.scenarios, function (scenario) {
      var found = battleHelpers.findMember(scenario, command.member.name, command.member.type);
      return found || false;
    });
    if (!member) {
      throw new Error(command.member.type + ' named ' + command.member.name + ' not found.');
    }

    if (command.target.name) {
      // Make sure target is valid
      var target = _.find(data.scenario.scenarios, function (scenario) {
        var found = battleHelpers.findMember(scenario, command.target.name, command.target.type);
        return found || false;
      });
      if (!target) {
        throw new Error(command.target.type + ' named ' + command.target.name + ' not found.');
      }
    }

    // Attach the command
    member.command = command;
  });

  return next(null, data);
}
