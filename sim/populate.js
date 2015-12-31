var battleHelpers = require(__dirname + '/../lib/battle_helpers');
var Action        = require(__dirname + '/../lib/action');
var _             = require('lodash');

/*
 * Populate scenario data from the previous update.
 */
module.exports = function (data, next) {
  var action = new Action();

  _.each(data.scenario.scenarios, function (scenario) {
    _.each(scenario.characters, function (character) {
      character = findMember(character);
      character.is_enemy = false;
    });
    _.each(scenario.allies, function (ally) {
      ally = findMember(ally);
      ally.is_enemy = false;
    });
    _.each(scenario.battle.enemies.groups, function (group, group_index) {
      _.each(group.members, function (enemy, index) {
        enemy = findMember(enemy);
        enemy.front = group.front;
        enemy.group_index = group_index;
        enemy.is_enemy = true;
        enemy.in_battle = true;
        group.members[index] = enemy;
      });
      group.active = battleHelpers.isActive(group.members);
    });

    // copy character/ally data into battle object
    _.each(scenario.battle.characters.groups, copyMembers(scenario, 'characters'));
    _.each(scenario.battle.allies.groups, copyMembers(scenario, 'allies'));
  });

  return next(null, data);

  // match up data with scenario
  function findMember (member) {
    var type  = member.type || 'character';
    var name  = member.species || member.name;
    var index = _.findIndex(data[type], { name : name });
    var match;

    if (index > -1) {
      match = _.cloneDeep(data[type][index]);

      // do not allow the name of monster recruits to be overwritten
      delete match.name;

      var new_member = _.merge(member, match);
      _.each(new_member.effects, function (effect) {
        action.set(effect, data);
        if (action.is_set) {
          action.applyPreviousEffect(new_member, data.RNG);
        }
      });

      battleHelpers.checkHP(new_member);
      battleHelpers.checkMP(new_member);
      
      new_member.in_battle  = false;
      new_member.can_act    = (new_member.can_act !== false);
      new_member.can_target = (new_member.can_target !== false);

      // copy characters back into game data (for ease of saving later)
      if (type === 'character') {
        data[type][index] = new_member;
      }

      return new_member;
    } else {
      throw new Error('Data for ' + member.name + ' not found!');
    }
  }

  // copy members from character/ally array into the battle
  function copyMembers (scenario, groupType) {
    return function (group, group_index) {
      _.each(group.members, function (member, index) {
        var type  = member.type || 'character';
        var found = _.findIndex(scenario[groupType], { name : member.name, type : type });

        if (found > -1) {
          group.members[index] = scenario[groupType][found];
          group.members[index].in_battle = true;
          group.members[index].front = group.front;
          group.members[index].group_index = group_index;
        } else {
          throw new Error('Data for ' + member.name + ' not found!');
        }
      });
      group.active = battleHelpers.isActive(group.members);
    }
  }
}
