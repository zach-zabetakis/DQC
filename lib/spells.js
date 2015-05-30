var nconf = require('nconf');
var _     = require('lodash');

var internals = {};

module.exports = internals.Spell = function (spell, spell_list) {
  if (_.isString(spell) && _.isArray(spell_list)) {
    spell = this.getSpell(spell, spell_list);
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

// gets the spell data for a spell name passed in
internals.Spell.prototype.getSpell = function getSpell(spell_name, spell_list) {
  spell_name = (spell_name || '').toLowerCase();

  var spell = _.find(spell_list, function (curr_spell) {
    if (curr_spell.name) {
      return (curr_spell.name.toLowerCase() === spell_name);
    }
  });

  return spell;
};

// sets the spell object with a new type of spell
internals.Spell.prototype.setSpell = function setSpell(spell, spell_list) {
  this.clearSpell();

  if (_.isString(spell) && _.isArray(spell_list)) {
    spell = this.getSpell(spell, spell_list);
  }

  if (_.isPlainObject(spell)) {
    _.assign(this, spell);
    this.has_spell = true;
  }
};
