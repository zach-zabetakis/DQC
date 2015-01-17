var _ = require('lodash');

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
  var spell = _.find(this._spells, { name : spell_name });

  if (spell) {
    switch (spell.type) {
      case 'healing':

        break;
      case 'revival':

        break;
      case 'offensive':

        break;
      case 'status':

        break;
      case 'buff':
        target[spell.stat_to] += parseInt(target[spell.stat_from] * spell.multiplier, 10);
        // TODO: maximum stat values
        break;
      case 'debuff':
        target[spell.stat_to] -= parseInt(target[spell.stat_from] * spell.multiplier, 10);
        target[spell.stat_to] = Math.max(target[spell.stat_to], 0);
        break;
      case 'travel':
        break;
      default:
        break;
    }
  }
}
