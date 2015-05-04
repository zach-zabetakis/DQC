var formulas = require(__dirname + '/formulas');
var helpers  = require(__dirname + '/helpers');
var _        = require('lodash');

module.exports = function (battleHelpers) {
  return {
    attack          : attack,
    charge          : charge,
    heart           : heart,
    item            : item,
    none            : none,
    parry           : parry,
    retreat         : retreat,
    run             : run,
    shift           : shift,
    skill           : skill,
    spell           : spell,
    validateAttack  : validateAttack,
    validateCharge  : validateCharge,
    validateHeart   : validateHeart,
    validateItem    : validateItem,
    validateNone    : validateNone,
    validateParry   : validateParry,
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
    var targetName = target.displayName();
    var curr_miss  = member.adj_miss + (_.includes(member.status, 'SU') ? 20 : 0);
    var message    = '';
    var damage     = 0;
    var is_miss    = false;
    var is_crit    = false;
    var is_dodge   = false;
    var is_plink   = false;
    var ATK, DEF;
    var onHits;

    var prefix = (member.command.flavor_prefix || '').trim();
    if (!prefix && member.flavor && _.isArray(member.flavor.attack)) {
      prefix = member.flavor.attack[DQC.RNG(0, member.flavor.attack.length - 1)] || 'attacks';
    } else if (!prefix) {
      prefix = 'attacks';
    }
    var suffix = (member.command.flavor_suffix || '').trim();
    suffix = suffix ? ' ' + suffix : suffix;

    if (member.target_all) {
      // attack all members of the opposing side

    } else if (member.target_group) {
      // look up group containing the target

    } else {
      // single target attack
      ATK = member.curr_attack;
      DEF = target.curr_defense;

      is_miss   = DQC.RNG.bool(curr_miss, 32);
      is_crit   = DQC.RNG.bool(member.adj_critical, 32);
      is_dodge  = DQC.RNG.bool(target.adj_dodge, 256);
      is_on_hit = member.on_hit && DQC.RNG.bool(member.on_hit.chance, 32);

      if (!is_miss && !is_dodge) {
        if (is_crit) {
          // damage according to critical hit formula
          damage  = formulas.criticalDamage(ATK, DQC.RNG);
        } else {
          is_plink = formulas.plink(ATK, DEF, member.is_enemy);
          if (is_plink) {
            // damage according to plink formula
            damage = formulas.plinkDamage(ATK, DEF, member.is_enemy, DQC.RNG);
          } else {
            // damage according to standard physical attack formula
            damage = formulas.physicalDamage(ATK, DEF, DQC.RNG);
          }
        }
        if (target.parry) {
          damage = parseInt(damage / 2, 10);
        }

        if (damage && damage < target.curr_HP) {
          // attempt to apply on-hit effects to alive targets only
          onHits = battleHelpers.applyOnHitEffects(DQC, member, target);
        }
      }

      // construct message line
      if (is_miss && _.includes(member.status, 'SU')) {
        message = dispName + ' is beguiled by illusions!';
      } else {
        message = dispName + ' ' + prefix + ' ' + targetName + suffix + '!';
        if (is_crit)  {
          message += (member.is_enemy) ? ' A terrible blow!' : ' Excellent move!';
        }
        if (is_miss) {
          message += ' Attack missed!';
        } else if (is_dodge) {
          message += ' ' + targetName + ' ' + ((target.flavor && target.flavor.dodge) || 'smoothly dodges the attack') + '!';
        } else if (!damage) {
          message += ' Attack failed!'
        } else if (!target.is_dead) {
          message += ' Lost ' + damage + ' HP.';

          _.each(onHits, function (onHit) {
            damage += target.parry ? parseInt(onHit.damage / 2, 10) : onHit.damage;
            message += ' ' + onHit.message;
          });

          // apply damage to target
          battleHelpers.takeDamage(scenario, target, damage);
          if (target.is_dead) {
            message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : ' - Defeated!';
          }
        }
      }
    }

    return message;
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

  // Use monster heart power
  function heart (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' is using heart powers!';

    return message;
  }

  // Use item
  function item (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' is using an item!';

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
    var dispName = member.displayName();
    var message  = dispName + ' is running away!';

    return message;
  }

  // Shift to another group (switch groups)
  // Coupled with PARRY command to halve incoming damage for the turn.
  // TODO: command can be used to switch into group that does not yet exist.
  function shift (DQC, scenario, member) {
    var dispName     = member.displayName();
    var message      = dispName + ' switches groups!';
    var target       = member.command.target;
    var group_type   = battleHelpers.groupType(member);
    var member_group = _.findValue(scenario, 'battle.' + group_type + '.groups.' + member.group_index);
    var target_group = _.findValue(scenario, 'battle.' + group_type + '.groups.' + target.group_index);
    var position     = /before/i.test(member.command.name) ? 0 : 1;
    var member_index;
    var target_index;

    if (member_group && target_group) {
      member_index = _.findIndex(member_group.members, { name : member.name });
      target_index = _.findIndex(target_group.members, { name : target.name });
      if (member_index !== -1 && target_index !== -1) {
        // shortcut to move a member from one group to another
        target_group.members.splice(target_index + position, 0, member_group.members.splice(member_index, 1)[0]);

        // remove the previous group if it no longer contains anyone
        if (!member_group.members.length) {
          scenario.battle[group_type].groups.splice(member.group_index, 1);
        }

        member.group_index = target.group_index;
      }
    }

    battleHelpers.updateActiveGroups(scenario, group_type);

    return message;
  }

  // Use a skill
  function skill (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' is using a skill!';

    return message;
  }

  // Cast a spell
  function spell (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' is casting a spell!';

    return message;
  }

  // Validate an ATTACK command
  function validateAttack (data, command) {
    var invalidMsg   = 'Invalid Command - (' + command.member.displayName() + ' ATTACK): ';

    if (!command.target.name) {
      throw new Error(invalidMsg + 'no target selected.');
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

  // Validate a HEART command
  function validateHeart (data, command) {

  }

  // Validate an ITEM command
  function validateItem (data, command) {

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
  // TODO: command can be used to switch into group that does not yet exist.
  function validateShift (data, command) {
    var invalidMsg   = 'Invalid Command - (' + command.member.displayName() + ' SHIFT): ';
    var member_group = battleHelpers.groupType(command.member);
    var target_group = battleHelpers.groupType(command.target);

    if (member_group !== target_group) {
      throw new Error(invalidMsg + 'target must be in the ' + member_group + ' group.');
    } else if (command.member.group_index === command.target.group_index) {
      throw new Error(invalidMsg + 'target must come from a different group formation.');
    } else if (!/before|after/i.test(command.name)) {
      throw new Error(invalidMsg + 'command must specify a location (BEFORE or AFTER) relative to the target.');
    }

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

    return true;
  }

  // Validate a SKILL command
  function validateSkill (data, command) {

  }

  // Validate a SPELL command
  function validateSpell (data, command) {

  }
};

