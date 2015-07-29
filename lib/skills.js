var battleHelpers = require(__dirname + '/battle_helpers');
var helpers       = require(__dirname + '/helpers');
var nconf         = require('nconf');
var _             = require('lodash');

var internals = {};

module.exports = internals.Skill = function (skill, skill_list) {
  if (_.isString(skill) && _.isArray(skill_list)) {
    skill = this.findSkill(skill, skill_list);
  }

  if (_.isPlainObject(skill)) {
    _.assign(this, skill);
    this.has_skill = true;
  }
};

// applies the effects of a previously used skill to a target
internals.Skill.prototype.applyPreviousEffect = function applyPreviousEffect(target, RNG) {
  var max_stat = nconf.get('max_stat');
  var value;

  if (this.has_skill) {
    // only buffs and debuffs have a persisting skill effect.
    switch (this.persist) {
      case 'buff':
        if (this.stat_from && this.stat_to) {
          // calculate the stat increase amount
          if (this.minimum && this.range) {
            value = parseInt(this.minimum + RNG.integer(0, this.range), 10) || 0;
          } else {
            value = parseInt(target[this.stat_from] * this.multiplier, 10) || 0;
          }
          // do not allow the increase to put us over the stat cap
          if (max_stat[this.stat_to]) {
            value = Math.min(value, max_stat[this.stat_to] - target[this.stat_to]);
          }
          // add the stat increase to the target stat
          console.log('before: ' + target[this.stat_to] + '  after: ' + (target[this.stat_to] + value));
          target[this.stat_to] += value;
        }
        break;
      case 'debuff':
        if (this.stat_from && this.stat_to) {
          // calculate the stat decrease amount
          if (this.minimum && this.range) {
            value = parseInt(this.minimum + RNG.integer(0, this.range), 10) || 0;
          } else {
            value = parseInt(target[this.stat_from] * this.multiplier, 10) || 0;
          }
          // do not allow the decrease to put this stat below zero
          value = Math.min(value, target[this.stat_to]);
          console.log('before: ' + target[this.stat_to] + ' after: ' + (target[this.stat_to] - value));
          target[this.stat_to] -= value;
        }
        break;
      default:
        break;
    }
  }
};

// clears the current skill from this object
internals.Skill.prototype.clearSkill = function clearSkill() {
  var keys = _.keys(this);
  for (var i = 0; i < keys.length; i++) {
    delete this[keys[i]];
  }
  this.has_skill = false;
};

// returns the skill data for a skill name passed in
internals.Skill.prototype.findSkill = function findSkill(skill_name, skill_list) {
  skill_name = (skill_name || '').toLowerCase();

  var skill = _.find(skill_list, function (curr_skill) {
    if (curr_skill.name) {
      return (curr_skill.name.toLowerCase() === skill_name);
    }
  });

  return skill;
};

// returns the target(s) for this skill
internals.Skill.prototype.findTargets = function findTargets(scenario, member) {
  var target  = member.command.target;
  var targets = [];

  function pushTarget (curr_target) {
    targets.push(curr_target);
  }

  switch (this.target) {
    case 'self':
      pushTarget(member);
      break;
    case 'single':
      pushTarget(target);
      break;
    case 'group':
      var target_group = battleHelpers.groupType(target);
      target_group = _.findValue(scenario, 'battle.' + target_group + '.groups.' + target.group_index, {});
      _.each(target_group.members, pushTarget);
      break;
    case 'all':
      if (target.is_enemy) {
        _.each(scenario.battle.enemies.groups, function (group) {
          _.each(group.members, pushTarget);
        });
      } else {
        _.each(scenario.battle.characters.groups, function (group) {
          _.each(group.members, pushTarget);
        });
        _.each(scenario.battle.allies.groups, function (group) {
          _.each(group.members, pushTarget);
        });
      }
      break;
    case 'none':
      break;
    default:
      throw new Error('Unknown skill target type ' + this.target);
      break;
  }

  return targets;
};

// sets the skill object with a new type of skill
internals.Skill.prototype.setSkill = function setSkill(skill, skill_list) {
  this.clearSkill();

  if (_.isString(skill) && _.isArray(skill_list)) {
    skill = this.findSkill(skill, skill_list);
  }

  if (_.isPlainObject(skill)) {
    _.assign(this, skill);
    this.has_skill = true;
  }
};

// performs the currently set skil and returns the battle message
internals.Skill.prototype.useSkill = function useSkill(DQC, scenario, member, targets) {
  var max_stat  = nconf.get('max_stat');
  var saver     = battleHelpers.getSaver(this.resist);
  var messages  = [];
  var message   = '';
  var msgFizzle = 'Resisted!';
  var msgSaved  = 'Saved!';
  var results   = {};
  var target;
  var resist;
  var amount;
  var stat;

  // first, check for override function
  var overrideFunction = 'use' + this.name.replace(/\s/g, '').replace(/-/g, '_');
  if (typeof this[overrideFunction] === 'function') {
    message = this[overrideFunction](DQC, scenario, member, targets);
    return message;
  }

  function debuff (trgt) {
    var skill = this;
    var msg   = '';
    var res   = trgt.resist[skill.resist] || 0;
    var amt;
    var stat;

    // check for resistance/saver
    if (!DQC.RNG.bool(res, 16)) {
      if (saver && trgt.saver[saver] && DQC.RNG.bool(1, 4)) {
        msg += msgSaved;

      } else {
        if (skill.stat_from && skill.stat_to) {
          // calculate the stat decrease amount
          if (skill.minimum && skill.range) {
            amt = parseInt(skill.minimum + DQC.RNG.integer(0, skill.range), 10) || 0;
          } else {
            amt = parseInt(trgt[skill.stat_from] * skill.multiplier, 10) || 0;
          }

          // do not allow the decrease to put this stat below zero
          amt = Math.min(amt, trgt[skill.stat_to]);
          trgt[skill.stat_to] -= amt;

          stat = helpers.statDisplayName(skill.stat_to);
          msg += '-' + amt + ' ' + stat + '. ';
        }
        if (skill.status) {
          msg += battleHelpers.applyStatus(skill.status, trgt);
          if (trgt.is_dead) {
            trgt.defeated_by = member.displayName();
            msg += (trgt.type === 'character') ? helpers.format(' Thou art dead.', true) : ' - Defeated!';
          }
        }
      }
    } else {
      msg += msgFizzle;
    }

    return msg;
  };

  // otherwise, perform skill
  for (var i = 0; i < targets.length; i++) {
    target  = targets[i];
    message = target.displayName() + ': ';

    if (battleHelpers.isTargetable(target)) {
      if (_.includes(target.status, 'IR')) {
        message += 'no effect.';
        messages.push(message.trim());
        continue;
      }

      resist = target.resist[this.resist] || 0;

      switch (this.type) {
        case 'healing':
          amount = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
          if (amount) {
            battleHelpers.healDamage(scenario, target, amount);
            message += '+' + amount + ' HP. ';
          }

          if (this.status) {
            message += battleHelpers.cureStatus(this.status, target);
          }
          break;
        case 'revival':
          if (target.is_dead) {
            message += battleHelpers.cureStatus('DE', target);
            
            // cureStatus sets HP at 1; subtract an additional 1 to heal correct amount
            amount = parseInt(target[this.stat_from] * this.multiplier, 10) || 1;
            amount = (amount - 1);
            battleHelpers.healDamage(scenario, target, amount);
            battleHelpers.updateActiveGroups(scenario, battleHelpers.groupType(target));

          } else {
            message += 'no effect.';
          }
          break;
        case 'offensive':
          amount = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
          if (target.parry) {
            amount = parseInt(amount / 2, 10);
          }
          if (_.includes(target.status, 'BA')) {
            amount = parseInt(amount / 2, 10);
          }
          // check for resistance/saver
          if (!DQC.RNG.bool(resist, 16)) {
            if (saver && target.saver[saver] && DQC.RNG.bool(1, 4)) {
              message += msgSaved;
            } else {
              battleHelpers.takeDamage(scenario, target, amount);
              message += '-' + amount + ' HP.';
              if (target.is_dead) {
                target.defeated_by = member.displayName();
                message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : ' - Defeated!';
              }
            }
          } else {
            message += msgFizzle;
          }
          break;
        case 'status':
          // check for resistance/saver
          if (!DQC.RNG.bool(resist, 16)) {
            if (saver && target.saver[saver] && DQC.RNG.bool(1, 4)) {
              message += msgSaved;
            } else {
              message += battleHelpers.applyStatus(this.status, target);
              if (target.is_dead) {
                target.defeated_by = member.displayName();
                message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : '';
              }
            }
          } else {
            message += msgFizzle;
          }
          break;
        case 'buff':
          // certain skills can only be applied once
          if (_.includes([], this.name) && _includes(member.effects, this.name)) {
            message += 'no effect.';

          } else {
            if (this.stat_from && this.stat_to) {
              // calculate the stat increase amount
              if (this.minimum && this.range) {
                amount = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
              } else {
                amount = parseInt(target[this.stat_from] * this.multiplier, 10) || 0;
              }

              // do not allow the increase to put us over the stat cap
              if (max_stat[this.stat_to]) {
                amount = Math.min(amount, max_stat[this.stat_to] - target[this.stat_to]);
              }

              target[this.stat_to] += amount;
              stat = helpers.statDisplayName(this.stat_to);
              message += '+' + amount + ' ' + stat + '. ';
              
            }
            if (this.status) {
              message += battleHelpers.applyStatus(this.status, target);
            }
          }
          break;
        case 'debuff':
          message += debuff.call(this, target);
          break;
        case 'physical':
          results = battleHelpers.singleTargetAttack(DQC, member, target);
          // no secondary on hit effects for skills
          results.onHits = undefined;

          // construct message line
          message += battleHelpers.applyAttackResults(results, scenario, member, target);

          // if attack landed, apply skill effect(s)
          if (results.success && !target.is_dead) {
            message += ' ' + debuff.call(this, target);
          }

          break;
        default:
          throw new Error('Unknown skill type ' + this.type);
          break;
      }

      // if skill has a persisting effect, add it to effects list
      if (this.persist) {
        target.effects.push(this.name);
      }

      messages.push(message.trim());
    }
  }

  return messages.join(' ');
};

// custom override for Call Help skill
internals.Skill.prototype.useCallHelp = function useCallHelp(DQC, scenario, member, targets) {
  var monster    = _.find(DQC.data.monster, { name : member.name });
  var group_type = battleHelpers.groupType(member);
  var group      = _.findValue(scenario, 'battle.' + group_type + '.groups.' + member.group_index);
  var message    = '';

  if (monster && group) {
    monster = _.cloneDeep(monster);
    monster = battleHelpers.joinBattle(DQC, scenario, monster, 'monster', member.is_enemy);
    monster.symbol = battleHelpers.calculateNextSymbol(scenario, group_type, monster.name);
    if (monster.symbol === 'B') {
      // special case: a single monster will not have a symbol, so give the symbol 'A'
      member.symbol = 'A';
    }
    group.members.push(monster);
    battleHelpers.updateActiveGroups(scenario, group_type);
    message += monster.displayName() + ' joins the battle!';

  } else {
    message += 'But the call went unheard.';
  }

  return message;
};

// custom override for Call Other skill
internals.Skill.prototype.useCallOther = function useCallOther(DQC, scenario, member, targets) {
  var monster      = _.find(DQC.data.monster, { name : member.ally });
  var group_type   = battleHelpers.groupType(member);
  var battle_group = _.findValue(scenario, 'battle.' + group_type, {});
  var message      = '';
  var group_index;
  var group;

  if (monster) {
    monster = _.cloneDeep(monster);
    monster = battleHelpers.joinBattle(DQC, scenario, monster, 'monster', member.is_enemy);
    monster.symbol = battleHelpers.calculateNextSymbol(scenario, group_type, monster.name);
    if (monster.symbol === '') {
      // create new group
      group = battleHelpers.createNewGroup([monster]);
      battle_group.groups.push(group);

    } else {
      // add monster to existing group
      group_index = _.findIndex(battle_group.groups, function (group) {
        var first = group.members[0] || {};
        return (first.name === monster.name);
      });
      if (group_index > -1) {
        battle_group.groups[group_index].members.push(monster);
        if (monster.symbol === 'B') {
          // special case: a single monster will not have a symbol, so give the symbol 'A'
          battle_group.groups[group_index].members[0].symbol = 'A';
        }
      } else {
        // this is most likely an error, return a different messag as a clue
        message += 'But no help came.';
        return message;
      }
    }

    battleHelpers.updateActiveGroups(scenario, group_type);
    message += monster.displayName() + ' joins the battle!';

  } else {
    message += 'But the call went unheard.';
  }

  return message;
};

// custom override for Charge Up skill
internals.Skill.prototype.useChargeUp = function useChargeUp(DQC, scenario, member, targets) {
  var message = '';
  member.effects.push(this.name);
  return message;
};

// custom override for Open Up skill
internals.Skill.prototype.useOpenUp = function useOpenUp(DQC, scenario, member, targets) {
  var message = '';
  var amount;

  if (DQC.RNG.bool()) {
    // weapon upgrade * 1.375 ATK
    amount = parseInt(member.curr_attack * 0.375, 10);
    member.curr_attack += amount;
    member.effects.push('Open Up-A');
    message += 'Found a weapon! +' + amount + ' ATK.';

  } else {
    // armor upgrade * 1.5 DEF
    amount = parseInt(member.curr_defense * 0.5, 10);
    member.curr_defense += amount;
    member.effects.push('Open Up-D');
    message += 'Found a shield! +' + amount + ' DEF.';
  }

  return message;
};

// custom override for Toxic Strike skill
internals.Skill.prototype.useToxicStrike = function useToxicStrike(DQC, scenario, member, targets) {
  var results  = {};
  var messages = [];
  var message  = '';
  var target;
  var resist;

  function statusEffect (trgt, status, resist) {
    var saver  = battleHelpers.getSaver(resist);
    var amount = trgt.resist[resist] || 0;
    var msg    = '';

    if (!DQC.RNG.bool(amount, 16)) {
      if (saver && trgt.saver[saver] && DQC.RNG.bool(1, 4)) {
        msg += 'Saved!';
      } else {
        msg += battleHelpers.applyStatus(status, trgt);
      }
    } else {
      msg += 'Resisted!';
    }

    return msg;
  }

  for (var i = 0; i < targets.length; i++) {
    target  = targets[i];
    message = target.displayName() + ': ';

    if (battleHelpers.isTargetable(target)) {
      if (_.includes(target.status, 'IR')) {
        message += 'no effect.';
        messages.push(message.trim());
        continue;
      }

      results = battleHelpers.singleTargetAttack(DQC, member, target);
      // no secondary on hit effects for skills
      results.onHits = undefined;

      // construct message line
      message += battleHelpers.applyAttackResults(results, scenario, member, target);

      // if attack landed, attempt to apply POISON and SLEEP
      if (results.success && !target.is_dead) {
        message += ' ' + statusEffect(target, 'PO', 'poison');
        message += ' ' + statusEffect(target, 'SL', 'sleep');
      }

      messages.push(message.trim());
    }
  }

  return messages.join(' ');
};
