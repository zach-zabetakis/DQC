var helpers = require(process.cwd() + '/lib/helpers');
var Spells  = require(process.cwd() + '/sim/spells');
var nconf   = require('nconf');
var _       = require('lodash');

/*
 * Calculate additional data based on the data passed in.
 */
module.exports = function (data, next) {
  var initDataKeys = ['accessory', 'armor', 'character', 'experience', 'heart', 'helmet', 'monster', 'shield', 'spell', 'weapon'];
  _.each(initDataKeys, function (key) {
    if (!data[key]) {
      throw new Error(key + ' data not found!');
    }
  });

  calculateCharacterData(data);
  calculateMonsterData(data);
  populateScenario(data);

  return next(null, data);
};

// calculated/additional data attached to each monster
// TODO: sanitize monster stat values
function calculateMonsterData (data) {
  _.each(data.monster, function (monster) {
    // This will be overwritten later when new monsters are generated for a battle
    monster.curr_HP = monster.max_HP;

    monster.curr_MP = monster.max_MP;

    monster.curr_attack = monster.attack;

    monster.curr_defense = monster.defense;

    monster.curr_agility = monster.adj_agility = monster.agility;

    monster.miss = 0;

    monster.adj_critical = monster.critical;

    monster.adj_dodge = monster.dodge;
  });
}

// calculated/additional data attached to each character
function calculateCharacterData (data) {
  var spells = new Spells(data.spell);
  var max_stat = nconf.get('max_stat');

  _.each(data.character, function (character) {
    // max_HP
    character.max_HP = helpers.calculateStatBoost('HP', character.base_HP, data, character);
    character.max_HP = Math.max(character.max_HP, 0);

    // curr_HP cannot be greater than max_HP
    character.curr_HP = Math.min(character.curr_HP, character.max_HP);
    character.curr_HP = Math.max(character.curr_HP, 0);

    // max_MP
    character.max_MP = helpers.calculateStatBoost('MP', character.base_MP, data, character);
    character.max_MP = Math.max(character.max_MP, 0);

    // curr_MP cannot be greater than max_MP
    character.curr_MP = Math.min(character.curr_MP, character.max_MP);
    character.curr_MP = Math.max(character.curr_MP, 0);

    // base_strength
    character.base_strength = Math.min(character.base_strength, max_stat['base_strength']);

    // adj_strength
    character.adj_strength = helpers.calculateStatBoost('strength', character.base_strength, data, character);
    character.adj_strength = Math.max(character.adj_strength, 0);
    character.adj_strength = Math.min(character.adj_strength, max_stat['adj_strength']);

    // curr_strength
    character.curr_strength = character.adj_strength;

    // base_agility
    character.base_agility = Math.min(character.base_agility, max_stat['base_agility']);

    // adj_agility
    character.adj_agility = helpers.calculateStatBoost('agility', character.base_agility, data, character);
    character.adj_agility = Math.max(character.adj_agility, 0);
    character.adj_agility = Math.min(character.adj_agility, max_stat['adj_agility']);

    // curr_agility
    character.curr_agility = character.adj_agility;

    // attack
    character.attack = helpers.calculateStatBoost('attack', character.adj_strength, data, character);
    character.attack = Math.max(character.attack, 0);
    character.attack = Math.min(character.attack, max_stat['attack']);

    character.curr_attack = character.attack;

    // defense
    // base defense is agility / 2
    var base_defense = parseInt(character.adj_agility / 2, 10);
    character.defense = helpers.calculateStatBoost('defense', base_defense, data, character);
    character.defense = Math.max(character.defense, 0);
    character.defense = Math.min(character.defense, max_stat['defense']);

    character.curr_defense = character.defense;

    // miss
    character.miss = helpers.calculateStatBoost('miss', 0, data, character);
    character.miss = Math.max(character.miss, 0);

    // adj_critical
    // 'fighter' job gets a level-based critical bonus
    var base_critical = character.base_critical;
    if (character.job === 'fighter') {
      base_critical += parseInt(character.level / 4, 10);
    }
    character.adj_critical = helpers.calculateStatBoost('critical', base_critical, data, character);
    character.adj_critical = Math.max(character.adj_critical, 0);

    // adj_dodge
    // 'fighter' job gets an agility-based dodge bonus
    var base_dodge = character.base_dodge;
    if (character.job === 'fighter') {
      base_dodge += parseInt(character.adj_agility / 16, 10);
    }
    character.adj_dodge = helpers.calculateStatBoost('dodge', base_dodge, data, character);
    character.adj_dodge = Math.max(character.adj_dodge, 0);

    // resist
    character.resist = {};
    _.each(character.base_resist, function (base_value, key) {
      character.resist[key] = helpers.calculateStatBoost('resist.' + key, base_value, data, character);
      character.resist[key] = Math.max(character.resist[key], 0);
    });

    // saver
    character.saver = { burn : false, phys : false, ment : false };
    _.each(character.saver, function (value, key) {
      character.saver[key] = helpers.calculateStatBoost('saver.' + key, false, data, character);
    });

    // is_cursed
    character.is_cursed = helpers.calculateStatBoost('is_cursed', false, data, character);
  
    // apply spell effects from previous update(s)
    if (character.effects) {
      character.effects = character.effects.split(';');
      _.each(character.effects, function (effect) {
        spells.applySpellEffect(effect.trim(), character);
      });
    }
  });
}

// Fill characters and monsters into the scenario
function populateScenario (data) {
  var spells = new Spells(data.spell);

  _.each(data.scenario.quests, function (quest) {
    if (quest.in_battle) {
      _.each(quest.battle.sides, function (side) {
        _.each(side.groups, function (group) {
          _.each(group.members, function (member, index) {
            var match = _.find(data[member.type], { name : member.name });
            if (match) {
              var new_member = _.merge(match, member);
              if (member.type === 'monster') {
                _.each(new_member.effects, function (effect) {
                  spells.applySpellEffect(effect, new_member);
                });
              }
              group.members[index] = new_member;
            }
          });
        });
      });
    }
  });
}
