var helpers = require(__dirname + '/../lib/helpers');
var nconf   = require('nconf');
var _       = require('lodash');

/*
 * Calculate/sanitize additional data based on the data passed in.
 */
module.exports = function (data, next) {
  var initDataKeys = ['accessory', 'armor', 'character', 'experience', 'heart', 'helmet', 'monster', 'npc', 'shield', 'spell', 'weapon'];
  _.each(initDataKeys, function (key) {
    if (!data[key]) {
      throw new Error(key + ' data not found!');
    }
  });

  calculateMonsterData(data);
  calculateData(data, 'npc');
  calculateData(data, 'character');

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
  var statuses = nconf.get('status');

  _.each(data[type], function (member) {
    member.type = type;

    member.experience = Math.max(member.experience, 0);
    member.gold = Math.max(member.gold, 0);

    // max_HP
    member.max_HP = helpers.calculateStatBoost('HP', member.base_HP, data, member);
    member.max_HP = Math.max(member.max_HP, 0);

    // max_MP
    member.max_MP = helpers.calculateStatBoost('MP', member.base_MP, data, member);
    member.max_MP = Math.max(member.max_MP, 0);

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
      member.status = _.compact(_.map(member.status.split(';'), function (status) {
        status = status.trim();
        if (_.includes(statuses, status)) {
          return status;
        }
      }));
    } else {
      member.status = [];
    }

    // effects should be an array
    if (member.effects) {
      member.effects = _.compact(_.map(member.effects.split(';'), function (effect) { return effect.trim(); }));
    } else {
      member.effects = [];
    }

    // sanitize lottery tickets
    if (member.loto3) {
      member.loto3 = _.map(member.loto3, function (ticket) { return ticket.replace(/\s/g, ''); });
    }
    if (member.bol) {
      member.bol = _.map(member.bol, function (ticket) { return ticket.replace(/\s/g, ''); });
    }
  });
}
