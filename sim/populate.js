var battleHelpers = require(__dirname + '/../lib/battle_helpers');
var Spells        = require(__dirname + '/../lib/spells');
var _             = require('lodash');

/*
 * Populate scenario data from the previous update.
 */
module.exports = function (data, next) {
  var spells = new Spells(data.spell);

  _.each(data.scenario.scenarios, function (scenario) {
    // ignore all scenarios that should not be updated (insufficient commands, etc.)
    if (scenario.update) {
      _.each(scenario.characters, function (character) {
        character = findMember(character);
        character.is_enemy = false;
      });
      _.each(scenario.allies, function (ally) {
        ally = findMember(ally);
        ally.is_enemy = false;
      });
      _.each(scenario.battle.enemies.groups, function (group) {
        _.each(group.members, function (enemy) {
          enemy = findMember(enemy);
          enemy.is_enemy = true;
        });
        group.active = battleHelpers.isActive(group.members);
      });

      // copy character/ally data into battle object
      _.each(scenario.battle.characters.groups, copyMembers(scenario, 'characters'));
      _.each(scenario.battle.allies.groups, copyMembers(scenario, 'allies'));

      }
  });

  return next(null, data);

  // match up data with scenario
  function findMember (member) {
    var type  = member.type || 'character';
    var match = _.find(data[type], { name : member.name });

    if (match) {
      var new_member = _.merge(member, match);
      _.each(new_member.effects, function (effect) {
        spells.applySpellEffect(effect, new_member);
      });

      battleHelpers.checkHP(new_member);
      new_member.curr_MP = Math.min(new_member.curr_MP, new_member.max_MP);
      new_member.curr_MP = Math.max(new_member.curr_MP, 0);

      new_member.can_act    = (new_member.can_act !== false);
      new_member.can_target = (new_member.can_target !== false);

      return new_member;
    } else {
      throw new Error('Data for ' + member.name + ' not found!');
    }
  }

  // copy members from character/ally array into the battle
  function copyMembers (scenario, groupType) {
    return function (group) {
      _.each(group.members, function (member) {
        var type  = member.type || 'character';
        var match = _.findWhere(scenario[groupType], { name : member.name, type : type });

        if (match) {
          member = _.merge(member, match);
        } else {
          throw new Error('Data for ' + member.name + ' not found!');
        }
      });
      group.active = battleHelpers.isActive(group.members);
    }
  }
}
