var helpers = require(process.cwd() + '/lib/helpers');
var Spells  = require(process.cwd() + '/lib/spells');
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

  calculateMonsterData(data);
  calculateData(data, 'npc');
  calculateData(data, 'character');
  populateScenario(data);

  return next(null, data);
};

// calculated/additional data attached to each monster
function calculateMonsterData (data) {
  var max_stat = nconf.get('max_stat');
  
  _.each(data.monster, function (monster) {
    monster.attack = Math.max(monster.attack, 0);
    monster.attack = Math.min(monster.attack, max_stat['attack']);
    monster.curr_attack = monster.attack;

    monster.defense = Math.max(monster.defense, 0);
    monster.defense = Math.min(monster.defense, max_stat['defense']);
    monster.curr_defense = monster.defense;

    monster.agility = Math.max(monster.agility, 0);
    monster.agility = Math.min(monster.agility, max_stat['base_agility']);
    monster.curr_agility = monster.adj_agility = monster.agility;

    monster.miss = 0;

    monster.adj_critical = monster.critical;

    monster.adj_dodge = monster.dodge;

    monster.experience = Math.max(monster.experience, 0);
    monster.gold = Math.max(monster.gold, 0);
  });
}

// calculated/additional data attached to each character or NPC.
function calculateData (data, type) {
  var max_stat = nconf.get('max_stat');

  _.each(data[type], function (member) {
    member.type = type;

    member.experience = Math.max(member.experience, 0);
    member.gold = Math.max(member.gold, 0);

    // max_HP
    member.max_HP = helpers.calculateStatBoost('HP', member.base_HP, data, member);
    member.max_HP = Math.max(member.max_HP, 0);

    if (type === 'character') {
      // curr_HP cannot be greater than max_HP
      member.curr_HP = Math.min(member.curr_HP, member.max_HP);
      member.curr_HP = Math.max(member.curr_HP, 0);
    }

    // max_MP
    member.max_MP = helpers.calculateStatBoost('MP', member.base_MP, data, member);
    member.max_MP = Math.max(member.max_MP, 0);

    if (type === 'character') {
      // curr_MP cannot be greater than max_MP
      member.curr_MP = Math.min(member.curr_MP, member.max_MP);
      member.curr_MP = Math.max(member.curr_MP, 0);
    }

    // base_strength
    member.base_strength = Math.min(member.base_strength, max_stat['base_strength']);

    // adj_strength
    member.adj_strength = helpers.calculateStatBoost('strength', member.base_strength, data, member);
    member.adj_strength = Math.max(member.adj_strength, 0);
    member.adj_strength = Math.min(member.adj_strength, max_stat['adj_strength']);

    // curr_strength
    member.curr_strength = member.adj_strength;

    // base_agility
    member.base_agility = Math.min(member.base_agility, max_stat['base_agility']);

    // adj_agility
    member.adj_agility = helpers.calculateStatBoost('agility', member.base_agility, data, member);
    member.adj_agility = Math.max(member.adj_agility, 0);
    member.adj_agility = Math.min(member.adj_agility, max_stat['adj_agility']);

    // curr_agility
    member.curr_agility = member.adj_agility;

    // attack
    member.attack = helpers.calculateStatBoost('attack', member.adj_strength, data, member);
    member.attack = Math.max(member.attack, 0);
    member.attack = Math.min(member.attack, max_stat['attack']);

    member.curr_attack = member.attack;

    // defense
    // base defense is agility / 2
    var base_defense = parseInt(member.adj_agility / 2, 10);
    member.defense = helpers.calculateStatBoost('defense', base_defense, data, member);
    member.defense = Math.max(member.defense, 0);
    member.defense = Math.min(member.defense, max_stat['defense']);

    member.curr_defense = member.defense;

    // miss
    member.miss = helpers.calculateStatBoost('miss', 0, data, member);
    member.miss = Math.max(member.miss, 0);

    // adj_critical
    // 'fighter' job gets a level-based critical bonus
    var base_critical = member.base_critical;
    if (member.job === 'fighter') {
      base_critical += parseInt(member.level / 4, 10);
    }
    member.adj_critical = helpers.calculateStatBoost('critical', base_critical, data, member);
    member.adj_critical = Math.max(member.adj_critical, 0);

    // adj_dodge
    // 'fighter' job gets an agility-based dodge bonus
    var base_dodge = member.base_dodge;
    if (member.job === 'fighter') {
      base_dodge += parseInt(member.adj_agility / 16, 10);
    }
    member.adj_dodge = helpers.calculateStatBoost('dodge', base_dodge, data, member);
    member.adj_dodge = Math.max(member.adj_dodge, 0);

    // resist
    member.resist = {};
    _.each(member.base_resist, function (base_value, key) {
      member.resist[key] = helpers.calculateStatBoost('resist.' + key, base_value, data, member);
      member.resist[key] = Math.max(member.resist[key], 0);
    });

    // saver
    member.saver = { burn : false, phys : false, ment : false };
    _.each(member.saver, function (value, key) {
      member.saver[key] = helpers.calculateStatBoost('saver.' + key, false, data, member);
    });

    // is_cursed
    member.is_cursed = helpers.calculateStatBoost('is_cursed', false, data, member);
  
    // status should be an array
    if (member.status) {
      member.status = _.map(member.status.split(';'), function (status) { return status.trim(); });
    }

    // effects should be an array
    if (member.effects) {
      member.effects = _.map(member.effects.split(';'), function (effect) { return effect.trim(); });
    }
  });
}

// Fill characters and monsters into the scenario
function populateScenario (data) {
  var spells = new Spells(data.spell);

  _.each(data.scenario.scenarios, function (scenario) {
    _.each(scenario.characters.groups, populateGroup);
    _.each(scenario.allies.groups, populateGroup);
    _.each(scenario.enemies.groups, populateGroup);
  });

  function populateGroup (group) {
    _.each(group.members, function (member, index) {
      var type  = member.type || 'character';
      var match = _.find(data[type], { name : member.name });
      if (match) {
        var new_member = _.merge(member, match);
        _.each(new_member.effects, function (effect) {
          spells.applySpellEffect(effect, new_member);
        });
        group.members[index] = new_member;
      } else {
        throw new Error('Data for ' + member.name + ' not found!');
      }
    });
  }
}
