var helpers = require(process.cwd() + '/lib/helpers');
var _       = require('lodash');

/*
 * Calculate additional data based on the data passed in.
 */
module.exports = function (data, next) {
  var initDataKeys = ['accessory', 'armor', 'character', 'experience', 'heart', 'helmet', 'monster', 'shield', 'weapon'];
  _.each(initDataKeys, function (key) {
    if (!data[key]) {
      throw new Error(key + ' data not found!');
    }
  });

  calculateCharacterData(data);

  return next(null, data);
};

// Character Data
function calculateCharacterData(data) {
  _.each(data.character, function (character) {
    // Level should be based on current experience value
    character.level = helpers.checkLevel(data.experience, character.job, character.experience);

    // adj_HP
    character.adj_HP = helpers.calculateAdjustedStat('HP', character.base_HP, data, character);

    // adj_MP
    character.adj_MP = helpers.calculateAdjustedStat('MP', character.base_MP, data, character);

    // adj_strength
    character.adj_strength = helpers.calculateAdjustedStat('strength', character.base_strength, data, character);

    // adj_agility
    character.adj_agility = helpers.calculateAdjustedStat('agility', character.base_agility, data, character);

    // attack
    character.attack = helpers.calculateAdjustedStat('attack', character.adj_strength, data, character);

    // defense
    // base defense is agility / 2
    var base_defense = parseInt(character.adj_agility / 2, 10);
    character.defense = helpers.calculateAdjustedStat('defense', base_defense, data, character);

    // adj_critical
    // 'fighter' job gets a level-based critical bonus
    var base_critical = character.base_critical;
    if (character.job === 'fighter') {
      base_critical += parseInt(character.level / 4, 10);
    }
    character.adj_critical = helpers.calculateAdjustedStat('critical', base_critical, data, character);

    // adj_dodge
    // 'fighter' job gets an agility-based dodge bonus
    var base_dodge = character.base_dodge;
    if (character.job === 'fighter') {
      base_dodge += parseInt(character.adj_agility / 16, 10);
    }
    character.adj_dodge = helpers.calculateAdjustedStat('dodge', base_dodge, data, character);

    // resist
    character.resist = {};
    _.each(character.base_resist, function (base_value, key) {
      character.resist[key] = helpers.calculateAdjustedStat('resist_' + key, base_value, data, character);
    });

    // TODO: saver
  });
}
