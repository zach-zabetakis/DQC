var formulas = require(__dirname + '/formulas');
var helpers  = require(__dirname + '/helpers');
var Item     = require(__dirname + '/items');
var Skill    = require(__dirname + '/skills');
var Spell    = require(__dirname + '/spells');
var nconf    = require('nconf');
var _        = require('lodash');

module.exports = function (battleHelpers) {
  return {
    attack          : attack,
    charge          : charge,
    dismiss         : dismiss,
    heart           : heart,
    item            : item,
    none            : none,
    parry           : parry,
    recall          : recall,
    retreat         : retreat,
    run             : run,
    shift           : shift,
    skill           : skill,
    spell           : spell,
    setPriority     : setPriority,
    validateAttack  : validateAttack,
    validateCharge  : validateCharge,
    validateDismiss : validateDismiss,
    validateHeart   : validateHeart,
    validateItem    : validateItem,
    validateNone    : validateNone,
    validateParry   : validateParry,
    validateRecall  : validateRecall,
    validateRetreat : validateRetreat,
    validateRun     : validateRun,
    validateShift   : validateShift,
    validateSkill   : validateSkill,
    validateSpell   : validateSpell
  };

  // Standard physical attack
  function attack (DQC, scenario, member) {
    var dispName   = member.displayName();
    var target     = member.command.target;
    var message    = '';
    var messages   = [];
    var results    = {};
    var count      = 0;

    if (target.is_dead && member.is_aware !== false) {
      member.command.target = target = battleHelpers.retarget(scenario, target);
    }

    var prefix = (member.command.flavor_prefix || '').trim();
    if (!prefix && member.flavor && _.isArray(member.flavor.attack)) {
      prefix = member.flavor.attack[DQC.RNG.integer(0, member.flavor.attack.length - 1)] || 'attacks';
    } else if (!prefix) {
      prefix = 'attacks';
    }
    var suffix = (member.command.flavor_suffix || '').trim();
    suffix = suffix ? ' ' + suffix : suffix;

    // used to loop over and attack all targets, constructing message line for battle
    function attackAllTargets (target) {
      if (battleHelpers.isTargetable(target)) {
        if (!scenario.battle.has_fronts || battleHelpers.isSameFront(member.front, target.front)) {
          results = battleHelpers.singleTargetAttack(DQC, member, target);
          message = target.displayName() + ':';
          if (nconf.get('attack_decay')) {
            results.damage = formulas.attackDecay(results.damage, count++);
          }
          message += ' ' + battleHelpers.applyAttackResults(results, DQC, scenario, member, target);
          messages.push(message);
        }
      }
    }

    if (member.target_all) {
      // attack all members of the opposing side
      if (target.is_enemy) {
        _.each(scenario.battle.enemies.groups, function (group) {
          _.each(group.members, attackAllTargets);
        });
      } else {
        _.each(scenario.battle.characters.groups, function (group) {
          _.each(group.members, attackAllTargets);
        });
        _.each(scenario.battle.allies.groups, function (group) {
          _.each(group.members, attackAllTargets);
        });
      }

      // construct message line
      message = dispName + ' ' + prefix + suffix + '!';
      message += messages.length ? ' ' + messages.join(' ') : '';

    } else if (member.target_group) {
      // look up group containing the target
      var target_group = battleHelpers.groupType(target);
      target_group = _.findValue(scenario, 'battle.' + target_group + '.groups.' + target.group_index, {});
      _.each(target_group.members, attackAllTargets);

      // construct message line
      message = dispName + ' ' + prefix + suffix + '!';
      message += messages.length ? ' ' + messages.join(' ') : '';

    } else {
      // single target attack
      results = battleHelpers.singleTargetAttack(DQC, member, target);

      // construct message line
      if (results.is_miss && _.includes(member.status, 'SU')) {
        message = dispName + ' is beguiled by illusions!';
      } else {
        message = dispName + ' ' + prefix + ' ' + target.displayName() + suffix + '!';
        message += ' ' + battleHelpers.applyAttackResults(results, DQC, scenario, member, target, true);
      }
    }

    return message.trim();
  }

  // Move forward in the group ordering
  // Coupled with PARRY command to halve incoming damage for the turn.
  function charge (DQC, scenario, member) {
    var dispName   = member.displayName();
    var message    = dispName + ' charges ahead!';
    var group_type = battleHelpers.groupType(member);
    var group      = _.findValue(scenario, 'battle.' + group_type + '.groups.' + member.group_index);
    var member_index;
    var target_index;

    if (group) {
      member_index = _.findIndex(group.members, { name : member.name });
      target_index = _.findIndex(group.members, { name : member.command.target.name });
      if (member_index !== -1 && target_index !== -1) {
        // shortcut to move a member in front of the target in the group formation
        group.members.splice(target_index, 0, group.members.splice(member_index, 1)[0]);
      }
    }

    member.parry = true;

    return message;
  }

  // Dismiss a monster recruit from battle
  function dismiss (DQC, scenario, member) {
    var dispName = member.displayName();
    var target   = member.command.name;
    var message  = dispName + ' dismisses ' + target + ' from battle!';

    return message;
  }

  // Use monster heart power
  function heart (DQC, scenario, member) {
    var dispName = member.displayName();
    var ability  = member.command.ability;
    var message  = '';
    var targets;

    if (ability) {
      message += dispName + "'s monster heart glows! ";
      // heart abilities can mimic spells, skills, or items
      switch (ability.type) {
        case 'ITEM':
          var item = new Item(ability.name, DQC.data);
          if (item.is_set) {
            message += item.displayMessage(dispName);
            targets = item.getTargets(scenario, member);
            message += ' ' + item.useItem(DQC, scenario, member, targets);
          }
          break;
        case 'SKILL':
          var skill = new Skill(ability.name, DQC.data);
          if (skill.is_set) {
            message += skill.displayMessage(dispName);
            if (DQC.RNG.bool(skill.miss, 32)) {
              message += ' But the move fails.';
            } else {
              targets = skill.getTargets(scenario, member);
              message += ' ' + skill.useSkill(DQC, scenario, member, targets);
            }
          }
          break;
        case 'SPELL':
          var spell = new Spell(ability.name, DQC.data);
          if (spell.is_set) {
            message += spell.displayMessage(dispName);
            if (DQC.RNG.bool(spell.miss, 32)) {
              message += ' But the spell fails.';
            } else {
              targets = spell.getTargets(scenario, member);
              message += ' ' + spell.castSpell(DQC, scenario, member, targets);
            }
          }
          break;
        default:
          break;
      }

      member.abilities.push(ability.name);
    }

    return message;
  }

  // Use item
  function item (DQC, scenario, member) {
    var item     = new Item(member.command.name, DQC.data);
    var dispName = member.displayName();
    var shatter  = true;
    var targets  = [];
    var message  = '';

    if (item.is_set) {
      message = item.displayMessage(dispName);
      if (item.hasItem(member)) {
        if (item.ability) {
          // item mimics a skill or spell ability
          switch (item.ability.type) {
            case 'SKILL':
              var skill = new Skill(item.ability.name, DQC.data);
              if (skill.is_set) {
                if (DQC.RNG.bool(skill.miss, 32)) {
                  message += ' But nothing happens.';
                } else {
                  targets = skill.getTargets(scenario, member);
                  message += ' ' + skill.useSkill(DQC, scenario, member, targets);
                }
              }
              break;
            case 'SPELL':
              var spell = new Spell(item.ability.name, DQC.data);
              spell.can_bounce = false;
              if (spell.is_set) {
                if (DQC.RNG.bool(spell.miss, 32)) {
                  message += ' But nothing happens.';
                } else {
                  targets = spell.getTargets(scenario, member);
                  message += ' ' + spell.castSpell(DQC, scenario, member, targets);
                }
              }
              break;
            default:
              break;
          }

        } else {
          targets = item.getTargets(scenario, member);
          message += ' ' + item.useItem(DQC, scenario, member, targets);
        }

        if (item.is_item) {
          // check whether the item is lost after use
          if (item.durability) {
            shatter = !DQC.RNG.bool(item.durability, 32);
            message += shatter ? ' The ' + item.name + ' shatters!' : '';
          }
          if (shatter) {
            item.removeItem(member);
          }
        }
      } else {
        message += ' But it is nowhere to be found!';
      }
    }

    return message;
  }

  // Do nothing
  function none (DQC, scenario, member) {
    var dispName = member.displayName();
    var flavor   = (member.flavor && member.flavor.idle) || 'is assessing the situation.';
    var message  = dispName + ' ' + flavor;

    return message;
  }

  // Parry incoming attacks, halving damage for the turn
  function parry (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' is on guard!';

    member.parry = true;

    return message;
  }

  // Call a monster recruit into battle
  function recall (DQC, scenario, member) {
    var dispName     = member.displayName();
    var name         = member.command.name;
    var message      = dispName + ' calls ' + name + ' into battle!';
    var recruit      = _.find(DQC.data.recruit, { name : name, owner : member.name });
    var position     = (member.command.extra === 'after') ? 1 : 0;
    var target       = member.command.target || {};
    var target_group = _.findValue(scenario.battle.allies, 'groups.' + target.group_index);
    var target_index;

    if (recruit) {
      recruit.in_battle = true;
      recruit.parry = true;
      scenario.allies.push(recruit);

      if (target_group) {
        // add recruit to existing monster group
        target_index = _.findIndex(target_group.members, { name : target.name });
        if (target_index !== -1) {
          target_group.members.splice(target_index + position, 0, recruit);
        }

      } else {
        // add recruit to new group (front is fixed to same front as player)
        new_group = battleHelpers.createNewGroup([recruit]);
        new_group.front = scenario.battle.has_fronts ? member.front : null;
        scenario.battle.allies.groups.push(new_group);
      }

      battleHelpers.updateActiveGroups(scenario, 'allies');

    } else {
      message += ' But the call went unheard.';
    }

    return message;
  }

  // Fall back in the group ordering
  // Coupled with PARRY command to halve incoming damage for the turn.
  function retreat (DQC, scenario, member) {
    var dispName   = member.displayName();
    var message    = dispName + ' falls back!';
    var group_type = battleHelpers.groupType(member);
    var group      = _.findValue(scenario, 'battle.' + group_type + '.groups.' + member.group_index);
    var member_index;
    var target_index;

    if (group) {
      member_index = _.findIndex(group.members, { name : member.name });
      target_index = _.findIndex(group.members, { name : member.command.target.name });
      if (member_index !== -1 && target_index !== -1) {
        // shortcut to move a member behind the target in the group formation
        group.members.splice(target_index+1, 0, group.members.splice(member_index, 1)[0]);
      }
    }

    member.parry = true;

    return message;
  }

  // Run away
  function run (DQC, scenario, member) {
    var dispName   = member.displayName();
    var message    = dispName + ' is running away!';
    var group_type;
    var target;

    // run target is toughest monster to run away from
    // based on run_fac * curr_agility
    function findRunTarget (groups) {
      var run_score = -1;
      var match;

      _.each(groups, function (group) {
        if (group.active) {
          _.each(group.members, function (member) {
            if (battleHelpers.isTargetable(member)) {
              if (run_score < member.run_score()) {
                run_score = member.run_score();
                match = member;
              }
            }
          });
        }
      });

      return match;
    }

    if (member.type !== 'monster') {
      // must pass a flee check in order to run away
      group_type = member.is_enemy ? 'characters' : 'enemies';
      target     = findRunTarget(scenario.battle[group_type].groups);
      if (target && formulas.run(member.run_score(), target.run_score(), DQC.RNG)) {
        battleHelpers.expelFromBattle(scenario, member);
      } else {
        message += ' But was blocked in front.';
      }

    } else if (member.is_enemy) {
      // enemy monsters flee without fail
      battleHelpers.expelFromBattle(scenario, member);

    } else if (member.owner) {
      // ally monsters that try to flee should be admonished by their owner
      message += ' But ' + member.owner + ' gives it a stern gaze.';

    } else {
      // ally monsters flee without fail
      battleHelpers.expelFromBattle(scenario, member);
    }

    return message;
  }

  // Shift to another group (switch groups)
  // Coupled with PARRY command to halve incoming damage for the turn.
  function shift (DQC, scenario, member) {
    var dispName     = member.displayName();
    var message      = dispName + ' switches groups!';
    var target       = member.command.target || {};
    var group_type   = battleHelpers.groupType(member);
    var battle_group = _.findValue(scenario, 'battle.' + group_type, {});
    var member_group = _.findValue(battle_group, 'groups.' + member.group_index);
    var target_group = _.findValue(battle_group, 'groups.' + target.group_index);
    var position     = (member.command.name === 'after') ? 1 : 0;
    var member_index;
    var target_index;
    var new_group;

    if (member.command.name === 'new' && member_group) {
      // shifting to a completely new group
      member_index = _.findIndex(member_group.members, { name : member.name });
      if (member_index !== -1) {
        new_group = battleHelpers.createNewGroup(member_group.members.splice(member_index, 1));
        new_group.front = scenario.battle.has_fronts ? member.command.extra : null;
        battle_group.groups.push(new_group);

        // remove the previous group if it no longer contains anyone
        if (!member_group.members.length) {
          battle_group.groups.splice(member.group_index, 1);
        }
      }

    } else if (member_group && target_group) {
      // shifting from one group to another
      member_index = _.findIndex(member_group.members, { name : member.name });
      target_index = _.findIndex(target_group.members, { name : target.name });
      if (member_index !== -1 && target_index !== -1) {
        // shortcut to move a member from one group to another
        target_group.members.splice(target_index + position, 0, member_group.members.splice(member_index, 1)[0]);

        // remove the previous group if it no longer contains anyone
        if (!member_group.members.length) {
          battle_group.groups.splice(member.group_index, 1);
        }
      }
    }

    member.parry = true;
    battleHelpers.updateActiveGroups(scenario, group_type);

    return message;
  }

  // Use a skill
  function skill (DQC, scenario, member) {
    var skill    = new Skill(member.command.name, DQC.data);
    var dispName = member.displayName();
    var targets  = [];
    var message  = '';

    if (skill.is_set) {
      message = skill.displayMessage(dispName);
      if (DQC.RNG.bool(skill.miss, 32)) {
        message += ' But the move fails.';

      } else {
        // get the target(s)
        targets = skill.getTargets(scenario, member);

        // use the skill
        message += ' ' + skill.useSkill(DQC, scenario, member, targets);
      }
    }

    return message;
  }

  // Cast a spell
  function spell (DQC, scenario, member) {
    var spell    = new Spell(member.command.name, DQC.data);
    var dispName = member.displayName();
    var targets  = [];
    var message  = '';
    var useMP    = true;

    if (spell.is_set) {
      message = spell.displayMessage(dispName);
      if (member.curr_MP < spell.MP) {
        message += ' MP is not high enough!';
        useMP = false;
        if (member.is_enemy) { member.can_cast = false }

      } else if (_.includes(member.status, 'ST')) {
        message += ' But that spell hath been blocked!';
        if (member.is_enemy) { member.can_cast = false }

      } else if (DQC.RNG.bool(spell.miss, 32)) {
        message += ' But the spell fails.';

      } else {
        // get the target(s)
        targets = spell.getTargets(scenario, member);

        // cast the spell
        message += ' ' + spell.castSpell(DQC, scenario, member, targets);
      }

      if (useMP) {
        member.curr_MP -= spell.MP || 0;
        battleHelpers.checkMP(member);
      }
    }

    return message;
  }

  // sets the priority for the given command
  function setPriority (data, command) {
    if (_.includes(['DISMISS', 'RECALL'], command.type)) {
      command.priority = 3;
    } else if (_.includes(['CHARGE', 'PARRY', 'RETREAT', 'SHIFT'], command.type)) {
      command.priority = 2;
    } else if (command.type === 'SKILL') {
      command.priority = (new Skill().findSkill(command.name, data) || {}).priority || 0;
    } else if (command.type === 'SPELL') {
      command.priority = (new Spell().findSpell(command.name, data) || {}).priority || 0;
    } else {
      command.priority = 0;
    }
  }

  // Validate an ATTACK command
  function validateAttack (data, command) {
    var invalidMsg = 'Invalid Command - (' + command.member.displayName() + ' ATTACK): ';

    if (!command.target.name) {
      throw new Error(invalidMsg + 'command must include a target.');
    } else {
      return true;
    }
  }

  // Validate a CHARGE command
  function validateCharge (data, command) {
    var invalidMsg   = 'Invalid Command - (' + command.member.displayName() + ' CHARGE): ';
    var member_group = battleHelpers.groupType(command.member);
    var target_group = battleHelpers.groupType(command.target);

    if (member_group !== target_group) {
      throw new Error(invalidMsg + 'target must be in the ' + member_group + ' group.');
    } else if (command.member.group_index !== command.target.group_index) {
      throw new Error(invalidMsg + 'target must come from the same group formation.');
    } else {
      return true;
    }
  }

  // Validate a DISMISS command
  function validateDismiss (data, command) {
    var invalidMsg = 'Invalid Command - (' + command.member.displayName() + ' DISMISS): ';
    var recruit    = _.find(data.recruit, { name : command.name, owner : command.member.name });

    if (!recruit) {
      throw new Error(invalidMsg + 'recruit named ' + command.name + ' was not found.');
    } else {
      return true;
    }
  }

  // Validate a HEART command
  function validateHeart (data, command) {
    var invalidMsg  = 'Invalid Command - (' + command.member.displayName() + ' HEART): ';
    var memberHeart = _.findValue(command.member, 'heart.name');
    var heart       = _.find(data.heart, { name : memberHeart });
    var ability;

    if (!command.name) {
      throw new Error(invalidMsg + 'command must include a heart ability name.');
    } else if (!heart) {
      throw new Error(invalidMsg + 'heart data not found.');
    } else if (_.includes(command.member.abilities, command.name)) {
      throw new Error(invalidMsg + 'ability ' + command.name + ' has already been used.');
    } else if (!command.target.name) {
      throw new Error(invalidMsg + 'command must include a target.');
    }
    
    ability = _.find(heart.abilities, { name : command.name });
    if (!ability) {
      throw new Error(invalidMsg + 'ability ' + command.name + ' not found for heart ' + heart.name);
    } else {
      command.ability = ability;
      switch (ability.type) {
        case 'ITEM':
          var item = new Item();
          if (!item.findItem(ability.name, data)) {
            throw new Error(invalidMsg + 'item name ' + ability.name + ' not found.');
          }
          break;
        case 'SKILL':
          var skill = new Skill();
          if (!skill.findSkill(ability.name, data)) {
            throw new Error(invalidMsg + 'skill name ' + ability.name + ' not found.');
          }
          break;
        case 'SPELL':
          var spell = new Spell();
          if (!spell.findSpell(ability.name, data)) {
            throw new Error(invalidMsg + 'spell name ' + ability.name + ' not found.');
          }
          break;
        default:
          throw new Error(invalidMsg + 'unknown heart ability type ' + ability.type);
          break;
      }
    }

    return true;
  }

  // Validate an ITEM command
  function validateItem (data, command) {
    var invalidMsg = 'Invalid Command - (' + command.member.displayName() + ' ITEM): ';
    var item       = new Item(command.name, data);
    var ability;

    if (!command.name) {
      throw new Error(invalidMsg + 'command must include an item name.');
    } else if (!item.is_set) {
      throw new Error(invalidMsg + 'item ' + command.name + ' not found.');
    } else if (!item.hasItem(command.member)) {
      throw new Error(invalidMsg + 'inventory or equipment does not contain item ' + command.name);
    } else if (!command.target.name && item.target !== 'none') {
      throw new Error(invalidMsg + 'command must include a target');
    }

    ability = item.ability;
    if (ability) {
      switch (ability.type) {
        case 'SKILL':
          var skill = new Skill();
          if (!skill.findSkill(ability.name, data)) {
            throw new Error(invalidMsg + 'skill name ' + ability.name + ' not found.');
          }
          break;
        case 'SPELL':
          var spell = new Spell();
          if (!spell.findSpell(ability.name, data)) {
            throw new Error(invalidMsg + 'spell name ' + ability.name + ' not found.');
          }
          break;
        default:
          throw new Error(invalidMsg + 'unknown item ability type ' + ability.type);
          break;
      }
    }

    return true;
  }

  // Validate a NONE command
  function validateNone (data, command) {
    // good job!
    return true;
  }

  // Validate a PARRY command
  function validateParry (data, command) {
    // no additional validation necessary
    return true;
  }

  // Validate a RECALL command
  function validateRecall (data, command) {
    var invalidMsg = 'Invalid Command - (' + command.member.displayName() + ' RECALL): ';
    var recruit    = _.find(data.recruit, { name : command.name, owner : command.member.name });

    if (!recruit) {
      throw new Error(invalidMsg + 'recruit named ' + command.name + ' was not found.');
    }

    _.each(data.scenario.scenarios, function (scenario) {
      if (_.findIndex(scenario.characters, { name : command.member.name }) > -1) {
        if (_.findIndex(scenario.allies, { name : command.name, owner : command.member.name }) > -1) {
          throw new Error(invalidMsg + 'recruit named ' + command.name + ' is already in the battle.');
        } else if (_.filter(scenario.allies, { type : 'monster' }).length >= 4) {
          throw new Error(invalidMsg + 'this battle already contains the maximum number of monster allies.');
        }
        return false;
      }
    });

    // TODO: validate target

    return true;
  }

  // Validate a RETREAT command
  function validateRetreat (data, command) {
    var invalidMsg   = 'Invalid Command - (' + command.member.displayName() + ' RETREAT): ';
    var member_group = battleHelpers.groupType(command.member);
    var target_group = battleHelpers.groupType(command.target);

    if (member_group !== target_group) {
      throw new Error(invalidMsg + 'target must be in the ' + member_group + ' group.');
    } else if (command.member.group_index !== command.target.group_index) {
      throw new Error(invalidMsg + 'target must come from the same group formation.');
    } else {
      return true;
    }
  }

  // Validate a RUN command
  function validateRun (data, command) {
    // no additional validation necessary
    return true;
  }

  // Validate a SHIFT command
  function validateShift (data, command) {
    var invalidMsg   = 'Invalid Command - (' + command.member.displayName() + ' SHIFT): ';
    var member_group = battleHelpers.groupType(command.member);
    var target_group = battleHelpers.groupType(command.target);
    command.name = (command.name || '').toLowerCase();
    var has_target   = command.name !== 'new';

    if (!_.includes(['after', 'before', 'new'], command.name)) {
      throw new Error(invalidMsg + 'command must specify a location (BEFORE or AFTER or NEW) relative to the target.');
    } else if (has_target && !command.target.name) {
      throw new Error(invalidMsg + 'command must include a target.');
    } else if (has_target && member_group !== target_group) {
      throw new Error(invalidMsg + 'target must be in the ' + member_group + ' group.');
    } else if (has_target && command.member.group_index === command.target.group_index) {
      throw new Error(invalidMsg + 'target must come from a different group formation.');
    }

    if (has_target) {
      _.each(data.scenario.scenarios, function (scenario) {
        var group = scenario.battle[target_group].groups[command.target.group_index];
        var found = group && _.findIndex(group.members, { name : command.target.name });

        if (found !== -1) {
          if (group.members.length > 3) {
            throw new Error(invalidMsg + 'target group already contains the maximum amount of members.');
          }
          return false
        }
      });
    } else {
      _.each(data.scenario.scenarios, function (scenario) {
        var group = scenario.battle[member_group].groups[command.member.group_index];
        var found = group && _.findIndex(group.members, { name : command.member.name });

        if (found !== -1) {
          if (scenario.battle.has_fronts && !command.extra) {
            throw new Error(invalidMsg + 'command must specify a front name for this battle.');
          }
          return false;
        }
      })
    }

    return true;
  }

  // Validate a SKILL command
  function validateSkill (data, command) {
    var invalidMsg = 'Invalid Command - (' + command.member.displayName() + ' SKILL): ';
    var skill      = new Skill(command.name, data);

    if (!command.name) {
      throw new Error(invalidMsg + 'command must include a skill name.');
    } else if (!skill.is_set) {
      throw new Error(invalidMsg + 'skill name ' + command.name + ' not found.');
    } else if (!command.target.name && skill.target !== 'none') {
      throw new Error(invalidMsg + 'command must include a target.');
    }

    return true;
  }

  // Validate a SPELL command
  function validateSpell (data, command) {
    var invalidMsg = 'Invalid Command - (' + command.member.displayName() + ' SPELL): ';
    var spell      = new Spell(command.name, data);

    if (!command.name) {
      throw new Error(invalidMsg + 'command must include a spell name.');
    } else if (!spell.is_set) {
      throw new Error(invalidMsg + 'spell name ' + command.name + ' not found.');
    } else if (!command.target.name) {
      throw new Error(invalidMsg + 'command must include a target.');
    }

    if (command.member.type === 'character') {
      if (!spell.learned[command.member.job] || spell.level > command.member.level) {
        throw new Error(invalidMsg + 'this character cannot cast this spell.');
      }
    }
    
    return true;
  }
};

