var battleHelpers = require(__dirname + '/battle_helpers');
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

  function checkBounce (curr_target) {
    if (_.includes(curr_target.status, 'BO')) {
      targets.push(member);
    } else {
      targets.push(curr_target);
    }
  }

  switch (this.target) {
    case 'self':
      targets.push(member);
      break;
    case 'single':
      checkBounce(target);
      break;
    case 'group':
      var target_group = battleHelpers.groupType(target);
      target_group = _.findValue(scenario, 'battle.' + target_group + '.groups.' + target.group_index, {});
      _.each(target_group.members, checkBounce);
      break;
    case 'all':
      if (target.is_enemy) {
        _.each(scenario.battle.enemies.groups, function (group) {
          _.each(group.members, checkBounce);
        });
      } else {
        _.each(scenario.battle.characters.groups, function (group) {
          _.each(group.members, checkBounce);
        });
        _.each(scenario.battle.allies.groups, function (group) {
          _.each(group.members, checkBounce);
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
