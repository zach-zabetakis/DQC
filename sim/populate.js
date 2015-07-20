var battleHelpers = require(__dirname + '/../lib/battle_helpers');
var Skill         = require(__dirname + '/../lib/skills');
var Spell         = require(__dirname + '/../lib/spells');
var _             = require('lodash');

/*
 * Populate scenario data from the previous update.
 */
module.exports = function (data, next) {
  var skill = new Skill();
  var spell = new Spell();

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
    var match = _.find(data[type], { name : member.name });
    match = _.cloneDeep(match);

    if (match) {
      var new_member = _.merge(member, match);
      _.each(new_member.effects, function (effect) {
        spell.setSpell(effect, data.spell);
        if (spell.has_spell) {
          spell.applyPreviousEffect(new_member, data.RNG);
        } else {
          skill.setSkill(effect, data.skill);
          if (skill.has_skill) {
            skill.applyPreviousEffect(new_member, data.RNG);
          }
        }
      });

      battleHelpers.checkHP(new_member);
      new_member.curr_MP = Math.min(new_member.curr_MP, new_member.max_MP);
      new_member.curr_MP = Math.max(new_member.curr_MP, 0);

      new_member.in_battle  = false;
      new_member.can_act    = (new_member.can_act !== false);
      new_member.can_target = (new_member.can_target !== false);

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
          group.members[index].group_index = group_index;
        } else {
          throw new Error('Data for ' + member.name + ' not found!');
        }
      });
      group.active = battleHelpers.isActive(group.members);
    }
  }
}
