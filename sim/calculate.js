var helpers = require(__dirname + '/../lib/helpers');
var nconf   = require('nconf');
var _       = require('lodash');

/*
 * Calculate/sanitize additional data based on the data passed in.
 */
module.exports = function (data, next) {
  var initDataKeys = [
    'accessory',
    'armor',
    'build_fighter',
    'build_priest',
    'build_ranger',
    'build_soldier',
    'build_wizard',
    'character',
    'command',
    'experience',
    'heart',
    'helmet',
    'item',
    'location',
    'monster',
    'npc',
    'quest',
    'recruit',
    'shield',
    'skill',
    'spell',
    'weapon',
    'zone'
  ];

  _.each(initDataKeys, function (key) {
    if (!data[key]) {
      throw new Error(key + ' data not found!');
    }
  });

  calculateMonsterData(data);
  calculateData(data, 'npc');
  calculateData(data, 'character');
  attachZoneData(data);
  expandHeartAbilities(data);
  expandAbilities(data);

  return next(null, data);
};

// calculated/additional data attached to each monster
function calculateMonsterData (data) {
  var max_stat = nconf.get('max_stat');
  
  _.each(data.monster, function (monster) {
    monster.max_HP  = Math.max(monster.max_HP, 0);

    monster.max_MP  = Math.max(monster.max_MP, 0);

    monster.attack = Math.max(monster.attack, 0);
    monster.attack = Math.min(monster.attack, max_stat['attack']);
    monster.curr_attack = monster.attack;

    monster.defense = Math.max(monster.defense, 0);
    monster.defense = Math.min(monster.defense, max_stat['defense']);
    monster.curr_defense = monster.defense;

    monster.agility = Math.max(monster.agility, 0);
    monster.agility = Math.min(monster.agility, max_stat['base_agility']);
    monster.curr_agility = monster.adj_agility = monster.agility;

    monster.adj_miss = monster.miss;

    monster.adj_critical = monster.critical;

    monster.adj_dodge = monster.dodge;

    monster.status = [];
    monster.effects = [];

    monster.run_fac   = Math.max(monster.run_fac, 0);
    monster.run_score = function () {
        return (parseInt(this.run_fac * this.curr_agility, 10) || 1);
    };

    monster.experience = Math.max(monster.experience, 0);
    monster.gold = Math.max(monster.gold, 0);

    monster.displayName = function () {
      return (this.name + (this.symbol || ''));
    };
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

    // make sure base STR/AGI are in-bounds
    member.base_strength = Math.min(member.base_strength, max_stat['base_strength']);
    member.base_agility = Math.min(member.base_agility, max_stat['base_agility']);

    helpers.recalculateStats(data, member);

    // run_fac (only used for PvP)
    member.run_fac   = 1;
    member.run_score = function () {
        return (parseInt(this.run_fac * this.curr_agility, 10) || 1);
    };

    // resist
    _.each(member.resist, function (base_value, key) {
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
    // target_group
    member.target_group = helpers.calculateStatBoost('target_group', false, data, member);
    // target_all
    member.target_all = helpers.calculateStatBoost('target_all', false, data, member);
    // hits (minimum of 1 and maximum of 2)
    member.hits = helpers.calculateStatBoost('double_hit', false, data, member) ? 2 : 1;
  
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

    // abilities should be an array
    if (member.abilities) {
      member.abilities = _.compact(_.map(member.abilities.split(';'), function (ability) { return ability.trim(); }));
    } else {
      member.abilities = [];
    }

    // sanitize lottery tickets
    if (member.loto3) {
      member.loto3 = _.map(member.loto3, function (ticket) { return ticket.replace(/\s/g, ''); });
    }
    if (member.bol) {
      member.bol = _.map(member.bol, function (ticket) { return ticket.replace(/\s/g, ''); });
    }

    member.displayName = function () {
      return (this.name + (this.symbol || ''));
    }
  });
}

// attach monster encounter list to locations based on zone
function attachZoneData (data) {
  _.each(data.location, function (location) {
    var zone = _.find(data.zone, { zone : location.zone });
    if (zone) {
      location.encounter = zone.encounter || [];
    } else {
      throw new Error('Zone data for ID: ' + location.zone + ' not found.');
    }
  });
}

// take semicolon separated list of heart abilities
// and create array detailing name/type of ability
function expandHeartAbilities (data) {
  _.each(data.heart, function (heart) {
    var abilities = [];
    if (heart.abilities) {
      _.each(heart.abilities.split(';'), function (ability) {
        ability = ability.split(':');
        var type = ability[0].trim();
        var name = ability[1] && ability[1].trim();
        if (_.includes(['ITEM', 'SKILL', 'SPELL'], type)) {
          if (_.findIndex(data[type.toLowerCase()], { name : name }) > -1) {
            abilities.push({ type : type, name : name });
          }
        }
      });
    }

    heart.abilities = abilities;
  });
}

// create array detailing name/type of ability for single ability items and equipment
function expandAbilities (data) {
  function expand (item) {
    var ability = (item.ability || '').split(':');
    item.ability = null;

    var type    = ability[0].trim();
    var name    = ability[1] && ability[1].trim();
    if (_.includes(['ITEM', 'SKILL', 'SPELL'], type)) {
      if (_.findIndex(data[type.toLowerCase()], { name : name }) > -1) {
        item.ability = { type : type, name : name };
      }
    }
  }

  _.each(data.accessory, expand);
  _.each(data.armor, expand);
  _.each(data.helmet, expand);
  _.each(data.item, expand);
  _.each(data.shield, expand);
  _.each(data.weapon, expand);
}
