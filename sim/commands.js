var battleHelpers = require(__dirname + '/../lib/battle_helpers');
var Skill         = require(__dirname + '/../lib/skills');
var Spell         = require(__dirname + '/../lib/spells');
var _             = require('lodash');

/*
 * Verify/Sanitize commands and attach them to the appropriate member.
 */
module.exports = function (data, next) {
  // bypass circular dependency issue with dependency injection
  var Commands = require(__dirname + '/../lib/commands')(battleHelpers);
  
  _.each(data.command, function (command) {
    // Make sure command is valid
    var validCommands = ['ATTACK', 'CHARGE', 'DISMISS', 'HEART', 'ITEM', 'NONE', 'PARRY', 'RECALL', 'RETREAT', 'RUN', 'SHIFT', 'SKILL', 'SPELL'];
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
        member.command = command;
        command.member = member;

        // Make sure target is valid
        var target;
        if (command.target.name) {
          target = battleHelpers.findMember(scenario, command.target.name, command.target.type);
          if (target) {
            command.target = target;
          } else {
            throw new Error(command.target.type + ' named ' + command.target.name + ' not found.');
          }
        }
        
        return false;
      }
    });
    if (!member) {
      throw new Error(command.member.type + ' named ' + command.member.name + ' not found.');
    }

    // Extra custom validation
    var validateFunction = 'validate' + (member.command.type || '').toTitleCase();
    if (typeof Commands[validateFunction] === 'function') {
      Commands[validateFunction](data, command);
    }

    // Assign priority level to the command
    Commands.setPriority(data, command);
  });

  return next(null, data);
}
