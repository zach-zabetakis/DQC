var battleHelpers = require(__dirname + '/battle_helpers');
var helpers       = require(__dirname + '/helpers');
var nconf         = require('nconf');
var _             = require('lodash');

var internals = {};

module.exports = internals.Spell = function (spell, spell_list) {
  if (_.isString(spell) && _.isArray(spell_list)) {
    spell = this.findSpell(spell, spell_list);
  }

  if (_.isPlainObject(spell)) {
    _.assign(this, spell);
    this.has_spell = true;
  }
};

// applies the effects of a previously cast spell to a target
internals.Spell.prototype.applyPreviousEffect = function applyPreviousEffect(target) {
  var max_stat = nconf.get('max_stat');
  var value;

  if (this.has_spell) {
    // only buffs and debuffs have a persisting spell effect.
    switch (this.type) {
      case 'buff':
        value = target[this.stat_to];
        value += parseInt(target[this.stat_from] * this.multiplier, 10);
        if (max_stat[this.stat_to]) {
          value = Math.min(value, max_stat[this.stat_to]);
        }
        target[this.stat_to] = value;
        break;
      case 'debuff':
        value = target[this.stat_to];
        value -= parseInt(target[this.stat_from] * this.multiplier, 10);
        target[this.stat_to] = Math.max(value, 0);
        break;
      default:
        break;
    }
  }
};

// casts the currently set spell and returns the battle message
internals.Spell.prototype.castSpell = function castSpell(scenario, member, targets, RNG) {
  var saver    = battleHelpers.getSaver(this.resist);
  var messages = [];
  var message  = '';
  var amount;
  var resist;

  for (var i = 0; i < targets.length; i++) {
    target  = targets[i];
    message = target.displayName() + ': ';

    // only revival spells can target the dead
    if (!target.is_dead || this.type === 'revival') {
      if (_.includes(target.status, 'BO') && member !== target) {
        message += 'Reflected! ' + member.displayName() + ': ';
        target = member;
      }

      resist = target.resist[this.resist] || 0;

      switch (this.type) {
        case 'healing':
          amount = parseInt(this.minimum + RNG.integer(0, this.range), 10) || 0;
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
          amount = parseInt(this.minimum + RNG.integer(0, this.range), 10) || 0;
          // check for resistance
          if (!RNG.bool(resist, 16)) {
            if (saver && target.saver[saver] && RNG.bool(1, 4)) {
              message += 'Saved!';
            } else {
              battleHelpers.takeDamage(scenario, target, amount);
              message += '-' + amount + ' HP.';
              if (target.is_dead) {
                target.defeated_by = member.displayName();
                message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : ' - Defeated!';
              }
            }
          } else {
            message += 'Fizzles!';
          }
          break;
        case 'status':

          break;
        case 'buff':

          break;
        case 'debuff':

          break;
        case 'travel':

          break;
        default:
          throw new Error('Unknown spell type ' + this.type);
          break;
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
  }
};
