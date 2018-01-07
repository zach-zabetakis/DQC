var Action        = require(__dirname + '/action');
var battleHelpers = require(__dirname + '/battle_helpers');
var helpers       = require(__dirname + '/helpers');
var nconf         = require('nconf');
var _             = require('lodash');

module.exports = Skill;

function Skill (skill, skill_list) {
  this.setSkill(skill, skill_list);
}

Skill.prototype = new Action();

// clears the current skill from this object
Skill.prototype.clearSkill = Skill.prototype.clear;

// returns the message that is displayed when this skill is used
Skill.prototype.displayMessage = function displayMessage(displayName) {
  var message = displayName + ' ' + this.flavor + '!';
  return message;
};

// returns the skill data for a skill name passed in
Skill.prototype.find = function find(skill_name, data) {
  skill_name = (skill_name || '').toLowerCase();

  var skill = _.find(data.skill, function (curr_skill) {
    if (curr_skill.name) {
      return (curr_skill.name.toLowerCase() === skill_name);
    }
  });
  
  return skill;
};

// alias for find
Skill.prototype.findSkill = Skill.prototype.find;

// sets the skill object with a new type of skill
Skill.prototype.setSkill = Skill.prototype.set;

// performs the currently set skil and returns the battle message
Skill.prototype.useSkill = function useSkill(DQC, scenario, member, targets) {
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
  var overrideFunction = 'use' + helpers.toFunctionName(this.name);
  if (typeof this[overrideFunction] === 'function') {
    message = this[overrideFunction](DQC, scenario, member, targets);
    return message;
  }

  // message for cases with no targets
  if (!targets.length) {
    return 'but nothing happens.';
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
            msg += battleHelpers.defeated(DQC, trgt, member, true);
            battleHelpers.updateActiveGroups(scenario, battleHelpers.groupType(target));
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

    if (battleHelpers.isTargetable(target) || (target.is_dead && this.type === 'revival')) {
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
            // healing refers to HP by default but can also restore MP
            if (/MP/.test(this.stat_to)) {
              target.curr_MP += amount;
              battleHelpers.checkMP(target);
              message += '+' + amount + 'MP.';
            } else {
              battleHelpers.healDamage(scenario, target, amount);
              message += '+' + amount + ' HP. ';
            }
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
          if (battleHelpers.isDefending(target)) {
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
                message += battleHelpers.defeated(DQC, target, member);
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
                message += battleHelpers.defeated(DQC, target, member, true);
                battleHelpers.updateActiveGroups(scenario, battleHelpers.groupType(target));
              }
            }
          } else {
            message += msgFizzle;
          }
          break;
        case 'buff':
          // certain skills can only be applied once
          if (this.status && _.includes(member.status, this.status)) {
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
          // multi-target attacks cannot have critical hits
          var critical = member.adj_critical;
          member.adj_critical = _.includes(['group', 'all'], this.target) ? 0 : critical;

          results = battleHelpers.singleTargetAttack(DQC, member, target);
          member.adj_critical = critical;

          // no secondary on hit effects for skills
          results.onHits = false;

          // construct message line
          message += battleHelpers.applyAttackResults(results, DQC, scenario, member, target);

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
Skill.prototype.useCallHelp = function useCallHelp(DQC, scenario, member, targets) {
  var monster    = _.find(DQC.data.monster, { name : member.name });
  var group_type = battleHelpers.groupType(member);
  var group      = _.findValue(scenario, 'battle.' + group_type + '.groups.' + member.group_index);
  var message    = '';

  if (monster && group) {
    monster = _.cloneDeep(monster);
    monster = battleHelpers.joinBattle(DQC, scenario, monster, member.is_enemy, 'monster');
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
Skill.prototype.useCallOther = function useCallOther(DQC, scenario, member, targets) {
  var monster      = _.find(DQC.data.monster, { name : member.ally });
  var group_type   = battleHelpers.groupType(member);
  var battle_group = _.findValue(scenario, 'battle.' + group_type, {});
  var message      = '';
  var group_index;
  var group;

  if (monster) {
    monster = _.cloneDeep(monster);
    monster = battleHelpers.joinBattle(DQC, scenario, monster, member.is_enemy, 'monster');
    monster.symbol = battleHelpers.calculateNextSymbol(scenario, group_type, monster.name);
    if (monster.symbol === '') {
      // create new group
      group = battleHelpers.createNewGroup([monster]);
      group.front = member.front;
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
        // this is most likely an error, return a different message as a clue
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
Skill.prototype.useChargeUp = function useChargeUp(DQC, scenario, member, targets) {
  var message = '';
  member.effects.push(this.name);
  return message;
};

// custom override for Evil Slash skill
Skill.prototype.useEvilSlash = function useEvilSlash(DQC, scenario, member, targets) {
  var critical = member.adj_critical;
  var target   = targets[0];
  var message  = '';
  var results;

  if (battleHelpers.isTargetable(target)) {
    message = target.displayName() + ': ';

    // all attacks that land are critical hits
    member.adj_critical = 32;
    results = battleHelpers.singleTargetAttack(DQC, member, target);
    member.adj_critical = critical;

    // no secondary on hit effects for skills
    results.onHits = false;

    // construct message line
    message += battleHelpers.applyAttackResults(results, DQC, scenario, member, target);
  }

  return message;
};

Skill.prototype.useFalconSlash = function useFalconSlash(DQC, scenario, member, targets) {
  var target  = targets[0];
  var message = '';
  var results;

  if (battleHelpers.isTargetable(target)) {
    message = target.displayName() + ': ';

    // run two attacks on the same target
    results = battleHelpers.singleTargetAttack(DQC, member, target);
    results.damage = parseInt(results.damage * this.multiplier, 10);
    message += battleHelpers.applyAttackResults(results, DQC, scenario, member, target);
    message += ' ';
    results = battleHelpers.singleTargetAttack(DQC, member, target);
    results.damage = parseInt(results.damage * this.multiplier, 10);
    message += battleHelpers.applyAttackResults(results, DQC, scenario, member, target);
  }

  return message;
};

Skill.prototype.useFreezingWaves = function useFreezingWaves(DQC, scenario, member, targets) {
  var messages = [];
  var message  = '';
  var target;

  for (var i = 0; i < targets.length; i++) {
    target  = targets[i];
    message = target.displayName() + ': ';

    if (battleHelpers.isTargetable(target)) {
      // clear ALL effects and ALL positive statuses
      message += battleHelpers.cureStatus('POS', target);
      target.effects = [];
      helpers.recalculateStats(DQC.data, target);
      messages.push(message.trim());
    }
  }

  return messages.join(' ');
};

// custom override for Open Up skill
Skill.prototype.useOpenUp = function useOpenUp(DQC, scenario, member, targets) {
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
Skill.prototype.useToxicStrike = function useToxicStrike(DQC, scenario, member, targets) {
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
      results.onHits = false;

      // construct message line
      message += battleHelpers.applyAttackResults(results, DQC, scenario, member, target);

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

// custom override for Neurotoxin skill
Skill.prototype.useNeurotoxin = function useNeurotoxin(DQC, scenario, member, targets) {
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
      results.onHits = false;

      // construct message line
      message += battleHelpers.applyAttackResults(results, DQC, scenario, member, target);

      // if attack landed, attempt to apply POISON and SLEEP
      if (results.success && !target.is_dead) {
        message += ' ' + statusEffect(target, 'PO', 'poison');
        message += ' ' + statusEffect(target, 'CF', 'chaos');
      }

      messages.push(message.trim());
    }
  }

  return messages.join(' ');
};
