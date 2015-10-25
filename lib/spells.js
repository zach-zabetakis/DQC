var Action        = require(__dirname + '/action');
var battleHelpers = require(__dirname + '/battle_helpers');
var helpers       = require(__dirname + '/helpers');
var nconf         = require('nconf');
var _             = require('lodash');

module.exports = Spell;

function Spell (spell, spell_list) {
  this.setSpell(spell, spell_list);
}

Spell.prototype = new Action();

// custom spell routine for Invisible spell
Spell.prototype.castInvisible = function castInvisible(DQC, scenario, member, targets) {
  var target  = targets[0];
  var message = '';

  if (battleHelpers.isTargetable(target)) {
    if (this.can_bounce && _.includes(target.status, 'BO') && member !== target) {
      message += 'Reflected! ' + member.displayName() + ': ';
      target = member;
    } else if (_.includes(target.status, 'IR')) {
      message += 'no effect.';
      message.push(message.trim());
    } else {
      message += 'turns invisible and flees from the battle!';
      battleHelpers.expelFromBattle(scenario, member);
    }
  }

  return message;
};

// custom spell routine for Outside spell
Spell.prototype.castOutside = function castOutside(DQC, scenario, member, targets) {
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
        // warp destination defaults to nowhere
        target.warp = member.command.extra || true;
        
      } else {
        message += 'no effect.';
      }
      
      messages.push(message);
    }
  }


  return messages.join(' ');
};

// custom spell routine for Radiant spell
Spell.prototype.castRadiant = function castRadiant(DQC, scenario, member, targets) {
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
Spell.prototype.castRepel = function castRepel(DQC, scenario, member, targets) {
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
Spell.prototype.castReturn = function castReturn(DQC, scenario, member, targets) {
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
        // warp destination defaults to Tantegel Castle
        target.warp = member.command.extra || 'C3';
      }
      
      messages.push(message.trim());
    }
  }

  return messages.join(' ');
};

// custom spell routine for Sleepmore spell
Spell.prototype.castSleepmore = function castSleepmore(DQC, scenario, member, targets) {
  var target  = targets[0] || {};
  var message = '';
  var resist;

  if (battleHelpers.isTargetable(target)) {
    message = target.displayName() + ': ';

    if (this.can_bounce && _.includes(target.status, 'BO') && member !== target) {
      message += 'Reflected! ' + member.displayName() + ': ';
      target = member;
    } else if (_.includes(target.status, 'IR')) {
      message += 'no effect.';
      return message;
    }

    // Sleepmore ignores all resistances below 15, and gives a 50% chance of landing otherwise
    resist = target.resist['sleep'] >= 15 ? 8 : 0;

    if (!DQC.RNG.bool(resist, 16)) {
      if (target.saver['ment'] && DQC.RNG.bool(1, 4)) {
        message += 'Saved!';
      } else {
        message += battleHelpers.applyStatus(this.status, target);
      }
    } else {
      message += 'Fizzles!';
    }
  }

  return message;
};

// casts the currently set spell and returns the battle message
Spell.prototype.castSpell = function castSpell(DQC, scenario, member, targets) {
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

  // message for cases with no targets
  if (!targets.length) {
    return 'but nothing happens.';
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
                battleHelpers.updateActiveGroups(scenario, battleHelpers.groupType(target));
              }
            }
          } else {
            message += msgFizzle;
          }
          break;
        case 'buff':
          // certain spells can only be applied once
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
                  battleHelpers.updateActiveGroups(scenario, battleHelpers.groupType(target));
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
Spell.prototype.clearSpell = Spell.prototype.clear;

// returns the message that is displayed when this spell is cast
Spell.prototype.displayMessage = function displayMessage(displayName) {
  var message = helpers.format('"' + this.invocation + '!"', false, true) + ' ' + displayName + ' casts ' + this.name + '!';
  return message;
};

// returns the spell data for a spell name passed in
Spell.prototype.find = function find(spell_name, data) {
  spell_name = (spell_name || '').toLowerCase();

  var spell = _.find(data.spell, function (curr_spell) {
    if (curr_spell.name) {
      return (curr_spell.name.toLowerCase() === spell_name);
    }
  });

  return spell;
};

// alias for find
Spell.prototype.findSpell = Spell.prototype.find;

// sets the spell object with a new type of spell
Spell.prototype.set = function set(spell, data) {
  this.clearSpell();

  if (_.isString(spell) && _.isPlainObject(data)) {
    spell = this.findSpell(spell, data);
  }

  if (_.isPlainObject(spell)) {
    _.assign(this, spell);
    this.is_set = true;
    this.can_bounce = true;
  }
};

// alias for set
Spell.prototype.setSpell = Spell.prototype.set;
