var battleHelpers = require(__dirname + '/battle_helpers');
var helpers       = require(__dirname + '/helpers');
var nconf         = require('nconf');
var _             = require('lodash');

var internals = {};

module.exports = internals.Spell = function (spell, spell_list) {
  this.setSpell(spell, spell_list);
};

// applies the effects of a previously cast spell to a target
internals.Spell.prototype.applyPreviousEffect = function applyPreviousEffect(target, RNG) {
  var max_stat = nconf.get('max_stat');
  var value;

  if (this.has_spell) {
    // only buffs and debuffs have a persisting spell effect.
    switch (this.persist) {
      case 'buff':
        if (this.stat_to) {
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
          target[this.stat_to] += value;
        }
        break;
      case 'debuff':
        if (this.stat_to) {
          // calculate the stat decrease amount
          if (this.minimum && this.range) {
            value = parseInt(this.minimum + RNG.integer(0, this.range), 10) || 0;
          } else {
            value = parseInt(target[this.stat_from] * this.multiplier, 10) || 0;
          }
          // do not allow the decrease to put this stat below zero
          value = Math.min(value, target[this.stat_to]);
          target[this.stat_to] -= value;
        }
        break;
      default:
        break;
    }
  }
};

// custom spell routine for Outside spell
internals.Spell.prototype.castOutside = function castOutside(DQC, scenario, member, targets) {
  var messages = [];
  var message  = '';
  var target;

  for (var i = 0; i < targets.length; i++) {
    target  = targets[i];
    message = target.displayName() + ': ';

    if (target.in_battle) {
      if (scenario.is_indoors) {
        message += 'Transported outside.';
        battleHelpers.expelFromBattle(scenario, target);
        // TODO: warp should refer to map position of destination
        target.warp = true;
        
      } else {
        message += 'no effect.';
      }
      
      messages.push(message);
    }
  }


  return messages.join(' ');
};

// custom spell routine for Radiant spell
internals.Spell.prototype.castRadiant = function castRadiant(DQC, scenario, member, targets) {
  var message = '';

  if (scenario.light_level !== null) {
    message = 'Suffused with a warm glow.';
    scenario.light_level = 3;

  } else {
    message = 'no effect.';
  }

  return message;
};

// custom spell routine for Repel spell
internals.Spell.prototype.castRepel = function castRepel(DQC, scenario, member, targets) {
  var messages = [];
  var message  = '';
  var target;

  for (var i = 0; i < targets.length; i++) {
    target  = targets[i];
    message = target.displayName() + ': ';

    if (battleHelpers.isTargetable(target)) {
      if (this.can_bounce && _.includes(target.status, 'BO') && member !== target) {
        message += 'Reflected! ' + member.displayName() + ': ';
        target = member;
      } else if (_.includes(target.status, 'IR')) {
        message += 'no effect.';
        messages.push(message.trim());
        continue;
      }

      // Perform a flee check for enemy monsters.
      if (target.type === 'monster') {
        // if target STR >= monster attack * 2, the monster will flee at a 25% rate
        if ((target.attack * 2) <= member.adj_strength) {
          if (DQC.RNG.bool(1, 4)) {
            message += 'is running away!';
            battleHelpers.expelFromBattle(scenario, target);
          } else {
            message += 'is unimpressed.';
          }
        }
      } else {
        message += 'no effect.';
      }
      
      messages.push(message.trim());
    }
  }

  return messages.join(' ');
};

// custom spell routine for Return spell
internals.Spell.prototype.castReturn = function castReturn(DQC, scenario, member, targets) {
  var messages = [];
  var message  = '';
  var target

  for (var i = 0; i < targets.length; i++) {
    target  = targets[i];
    message = target.displayName() + ': ';

    if (target.in_battle) {
      if (scenario.is_indoors) {
        message += 'Head crashes into the ceiling! -1 HP.';
        battleHelpers.takeDamage(scenario, target, 1);
        if (target.is_dead) {
          message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : ' - Defeated!';
        }

      } else {
        message += 'Flies high into the sky!';
        battleHelpers.expelFromBattle(scenario, target);
        // TODO: warp should refer to map position of destination
        target.warp = true;
      }
      
      messages.push(message.trim());
    }
  }

  return messages.join(' ');
};

// casts the currently set spell and returns the battle message
internals.Spell.prototype.castSpell = function castSpell(DQC, scenario, member, targets) {
  var max_stat  = nconf.get('max_stat');
  var saver     = battleHelpers.getSaver(this.resist);
  var messages  = [];
  var message   = '';
  var msgFizzle = 'Fizzles!';
  var msgSaved  = 'Saved!';
  var target;
  var resist;
  var amount;
  var stat;

  // first, check for override function
  var overrideFunction = 'cast' + this.name.replace(/[\s']/g, '').replace(/-/g, '_');
  if (typeof this[overrideFunction] === 'function') {
    message = this[overrideFunction](DQC, scenario, member, targets);
    return message;
  }

  // otherwise, cast spell
  for (var i = 0; i < targets.length; i++) {
    target  = targets[i];
    message = target.displayName() + ': ';

    // only revival spells can target the dead
    if (battleHelpers.isTargetable(target) || (target.is_dead && this.type === 'revival')) {
      if (this.can_bounce && _.includes(target.status, 'BO') && member !== target) {
        message += 'Reflected! ' + member.displayName() + ': ';
        target = member;
      } else if (_.includes(target.status, 'IR')) {
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
          if (target.parry) {
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
                message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : ' - Defeated!';
              }
            }
          } else {
            message += msgFizzle;
          }
          break;
        case 'buff':
          // certain spells can only be applied once
          if (_.includes(['Barrier, BeDragon, Bikill, Bounce, Ironize'], this.name) && _includes(member.effects, this.name)) {
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
          // check for resistance/saver
          if (!DQC.RNG.bool(resist, 16)) {
            if (saver && target.saver[saver] && DQC.RNG.bool(1, 4)) {
              message += msgSaved;

            } else {
              if (this.stat_from && this.stat_to) {
                // calculate the stat decrease amount
                if (this.minimum && this.range) {
                  amount = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
                } else {
                  amount = parseInt(target[this.stat_from] * this.multiplier, 10) || 0;
                }

                // do not allow the decrease to put this stat below zero
                amount = Math.min(amount, target[this.stat_to]);
                target[this.stat_to] -= amount;

                // Special Case: Robmagic restores the user's MP
                if (this.name === 'Robmagic') {
                  member.curr_MP += amount;
                  battleHelpers.checkMP(member);
                  message += 'Stole ' + amount + ' MP. ';

                } else {
                  stat = helpers.statDisplayName(this.stat_to);
                  message += '-' + amount + ' ' + stat + '. ';
                }
              }
              if (this.status) {
                message += battleHelpers.applyStatus(this.status, target);
                if (target.is_dead) {
                  target.defeated_by = member.displayName();
                  message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : '';
                }
              }
            }
          } else {
            message += msgFizzle;
          }
          break;
        case 'travel':
          // travel spells all have custom behavior, and should have been caught above
          break;
        default:
          throw new Error('Unknown spell type ' + this.type);
          break;
      }

      // if spell has a persisting effect, add it to effects list
      if (this.persist) {
        target.effects.push(this.name);
      }

      messages.push(message.trim());
    }
  }

  return messages.join(' ');
};

// clears the current spell from this object
internals.Spell.prototype.clearSpell = function clearSpell() {
  var keys = _.keys(this);
  for (var i = 0; i < keys.length; i++) {
    delete this[keys[i]];
  }
  this.has_spell = false;
};

// returns the message that is displayed when this spell is cast
internals.Spell.prototype.displayMessage = function displayMessage(displayName) {
  var message = helpers.format('"' + this.invocation + '!"', false, true) + ' ' + displayName + ' casts ' + this.name + '!';
  return message;
};

// returns the spell data for a spell name passed in
internals.Spell.prototype.findSpell = function findSpell(spell_name, spell_list) {
  spell_name = (spell_name || '').toLowerCase();

  var spell = _.find(spell_list, function (curr_spell) {
    if (curr_spell.name) {
      return (curr_spell.name.toLowerCase() === spell_name);
    }
  });

  return spell;
};

// returns the target(s) for this spell
internals.Spell.prototype.findTargets = function findTargets(scenario, member) {
  var target  = member.command.target;
  var targets = [];

  function pushTarget (curr_target) {
    targets.push(curr_target);
  }

  switch (this.target) {
    case 'none':
      break;
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
    case 'custom':
      // TODO: return/outside
      pushTarget(member);
      break;
    default:
      throw new Error('Unknown spell target type ' + this.target);
      break;
  }

  return targets;
};

// sets the spell object with a new type of spell
internals.Spell.prototype.setSpell = function setSpell(spell, spell_list) {
  this.clearSpell();

  if (_.isString(spell) && _.isArray(spell_list)) {
    spell = this.findSpell(spell, spell_list);
  }

  if (_.isPlainObject(spell)) {
    _.assign(this, spell);
    this.has_spell = true;
    this.can_bounce = true;
  }
};
