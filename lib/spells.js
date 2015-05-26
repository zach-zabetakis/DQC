var nconf = require('nconf');
var _     = require('lodash');

var internals = {};

module.exports = internals.Spells = function (spells) {
  if (!spells) {
    spells = [];
  }

  this._spells = spells;
};

// applies a spell's effects to a particular target
// this method is for previously cast spells only.
internals.Spells.prototype.applySpellEffect = function (spell_name, target) {
  spell_name = (spell_name || '').toLowerCase();

  var max_stat = nconf.get('max_stat');
  var spell    = this.getSpell(spell_name);
  var value;

  if (spell) {
    // only buffs and debuffs have a persisting spell effect.
    switch (spell.type) {
      case 'buff':
        value = target[spell.stat_to];
        value += parseInt(target[spell.stat_from] * spell.multiplier, 10);
        if (max_stat[spell.stat_to]) {
          value = Math.min(value, max_stat[spell.stat_to]);
        }
        target[spell.stat_to] = value;
        break;
      case 'debuff':
        value = target[spell.stat_to];
        value -= parseInt(target[spell.stat_from] * spell.multiplier, 10);
        target[spell.stat_to] = Math.max(value, 0);
        break;
      default:
        break;
    }
  }
}

// returns the spell from the name passed in
internals.Spells.prototype.getSpell = function (spell_name) {
  spell_name = (spell_name || '').toLowerCase();

  var spell = _.find(this._spells, function (curr_spell) {
    if (curr_spell.name) {
      return (curr_spell.name.toLowerCase() === spell_name);
    }
  });

  return spell;
};
