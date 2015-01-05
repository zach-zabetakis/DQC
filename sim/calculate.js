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

    // max_HP
    character.max_HP = helpers.calculateStatBoost('HP', character.base_HP, data, character);

    // curr_HP cannot be greater than max_HP
    character.curr_HP = Math.min(character.curr_HP, character.max_HP);

    // max_MP
    character.max_MP = helpers.calculateStatBoost('MP', character.base_MP, data, character);

    // curr_MP cannot be greater than max_MP
    character.curr_MP = Math.min(character.curr_MP, character.max_MP);

    // adj_strength
    character.adj_strength = helpers.calculateStatBoost('strength', character.base_strength, data, character);

    // adj_agility
    character.adj_agility = helpers.calculateStatBoost('agility', character.base_agility, data, character);

    // attack
    character.attack = helpers.calculateStatBoost('attack', character.adj_strength, data, character);

    // defense
    // base defense is agility / 2
    var base_defense = parseInt(character.adj_agility / 2, 10);
    character.defense = helpers.calculateStatBoost('defense', base_defense, data, character);

    // adj_critical
    // 'fighter' job gets a level-based critical bonus
    var base_critical = character.base_critical;
    if (character.job === 'fighter') {
      base_critical += parseInt(character.level / 4, 10);
    }
    character.adj_critical = helpers.calculateStatBoost('critical', base_critical, data, character);

    // adj_dodge
    // 'fighter' job gets an agility-based dodge bonus
    var base_dodge = character.base_dodge;
    if (character.job === 'fighter') {
      base_dodge += parseInt(character.adj_agility / 16, 10);
    }
    character.adj_dodge = helpers.calculateStatBoost('dodge', base_dodge, data, character);

    // resist
    character.resist = {};
    _.each(character.base_resist, function (base_value, key) {
      character.resist[key] = helpers.calculateStatBoost('resist.' + key, base_value, data, character);
    });

    // saver
    character.saver = { burn : false, phys : false, ment : false };
    _.each(character.saver, function (value, key) {
      character.saver[key] = helpers.calculateStatBoost('saver.' + key, false, data, character);
    });

    // is_cursed
    character.is_cursed = helpers.calculateStatBoost('is_cursed', false, data, character);
  });
}
