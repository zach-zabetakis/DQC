var nconf = require('nconf');
var _     = require('lodash');

module.exports = {
  calculateStatBoost : calculateStatBoost,
  displayStatus      : displayStatus,
  fixData            : fixData,
  format             : format,
  randomString       : randomString,
  recalculateStats   : recalculateStats,
  statDisplayName    : statDisplayName,
  toFunctionName     : toFunctionName
};

// Given a base stat value, add in stat boosts from equipped items
// This function can be used for characters and NPCs
function calculateStatBoost (stat_name, base_value, data, member) {
  var adj_stat    = base_value;
  var stat_boost  = 0;
  var multiplier  = 1;
  var check_equip = (member.type === 'character');

  function addBoost (value) {
    if (typeof value === 'boolean') {
      adj_stat = value;
    } else if (typeof value === 'number') {
      stat_boost += value;
    } else if (/^\*/.test(value)) {
      value = parseFloat(value.replace('*', ''), 10);
      multiplier = (isNaN(value)) ? multiplier : parseFloat(multiplier * value, 10);
    }
  }

  _.each(member.equip, function (name, key) {
    var item = _.find(data[key], { name : name });
    var stat = _.findValue(item, stat_name);

    if (stat) {
      if (check_equip) {
        if (item.equip && item.equip[member.job]) {
          addBoost(stat);
        }
      } else {
        addBoost(stat);
      }

      // break out of the loop if the stat has been set to boolean TRUE
      if (adj_stat === true) { return false }
    }
  });

  if (adj_stat === true) {
    return adj_stat;
  }

  _.each(member.inventory, function (name) {
    var accessory, stat;
    // items marked with "E:" are equipped accessories
    if (/^E:/.test(name)) {
      name      = name.replace('E:', '');
      accessory = _.find(data.accessory, { name : name });
      stat      = _.findValue(accessory, stat_name);

      if (stat) {
        if (check_equip) {
          if (accessory.equip && accessory.equip[member.job]) {
            addBoost(stat);
          }
        } else {
          addBoost(stat);
        }
      }

      // break out of the loop if the stat has been set to boolean TRUE
      if (adj_stat === true) { return false }
    }
  });

  if (adj_stat === true) {
    return adj_stat;
  }

  if (member.type === 'character') {
    var heart = _.find(data.heart, { name : member.heart.name });
    var stat  = _.findValue(heart, stat_name);
    if (stat) { addBoost(stat) }

    if (typeof adj_stat === 'boolean') {
      return adj_stat;
    }
  }

  // multiply the base stat first, then add the static boosts
  adj_stat = parseInt(adj_stat * multiplier, 10);
  adj_stat += stat_boost;

  return adj_stat;
}

// accepts an array of status effects
// returns a string of the ones that should be displayed
function displayStatus (status) {
  var display = ['CF', 'DE', 'DR', 'FR', 'NU', 'PO', 'SL', 'ST', 'SU'];
  var message = _.intersection(status, display);
  message = message.length ? (' ' + message.join(' ')) : '';
  return message;
}

// recursively iterates over an object, fixing data imported from a csv file.
// compacts arrays and changes string values to use boolean equivalents.
// currently fixes strings of 'TRUE' or 'FALSE' (case insensitive)
function fixData (result) {
  _.each(result, function (value, key) {
    if (value instanceof Array) {
      result[key] = _.compact(value);
    } else if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') {
        result[key] = true;
      } else if (value.toLowerCase() === 'false') {
        result[key] = false;
      }
    } else if (typeof value === 'object') {
      fixData(value);
    } 
  });
}

// Formats a message
function format (message, bold, italic) {
  var btag = '<b>', bend = '</b>';
  var itag = '<i>', iend = '</i>';
  var html = nconf.get('html');

  if (bold && html)   { message = btag + message + bend }
  if (italic && html) { message = itag + message + iend }

  return message;
}

// Returns a random string of characters
function randomString (RNG) {
  var length = RNG.integer(4, 11);
  var string = '';
  
  while (length-- > 0) {
    string += String.fromCharCode(RNG.integer(97, 122));
  }

  return string;
}

// Recalculate all stats
function recalculateStats (data, member, applyEffects) {
  var max_stat   = nconf.get('max_stat');
  var is_monster = (member.type === 'monster');
  applyEffects   = !!applyEffects;

  // max HP
  member.max_HP = calculateStatBoost('HP', member.base_HP, data, member);
  member.max_HP = Math.max(member.max_HP, 0);

  // max MP
  member.max_MP = calculateStatBoost('MP', member.base_MP, data, member);
  member.max_MP = Math.max(member.max_MP, 0);

  // strength
  if (!is_monster) {
    member.adj_strength = calculateStatBoost('strength', member.base_strength, data, member);
    member.adj_strength = Math.max(member.adj_strength, 0);
    member.adj_strength = Math.min(member.adj_strength, max_stat['adj_strength']);

    member.curr_strength = member.adj_strength;
  }

  // agility
  member.adj_agility = calculateStatBoost('agility', member.base_agility, data, member);
  member.adj_agility = Math.max(member.adj_agility, 0);
  member.adj_agility = Math.min(member.adj_agility, max_stat['adj_agility']);

  member.curr_agility = member.adj_agility;

  // attack
  if (!is_monster) {
    member.attack = calculateStatBoost('attack', member.adj_strength, data, member);
    member.attack = Math.max(member.attack, 0);
    member.attack = Math.min(member.attack, max_stat['attack']);
  }

  member.curr_attack = member.attack;

  // defense
  if (!is_monster) {
    var base_defense = parseInt(member.adj_agility / 2, 10);
    member.defense = calculateStatBoost('defense', base_defense, data, member);
    member.defense = Math.max(member.defense, 0);
    member.defense = Math.min(member.defense, max_stat['defense']);
  }

  member.curr_defense = member.defense;

  // miss
  member.adj_miss = calculateStatBoost('miss', member.base_miss, data, member);
  member.adj_miss = Math.max(member.adj_miss, 0);

  // critical
  var base_critical = is_monster ? member.critical : member.base_critical;
  if (member.job === 'fighter') {
    base_critical += parseInt(member.level / 4, 10);
  }
  member.adj_critical = calculateStatBoost('critical', base_critical, data, member);
  member.adj_critical = Math.max(member.adj_critical, 0);

  // dodge
  var base_dodge = is_monster ? member.dodge : member.base_dodge;
  if (member.job === 'fighter') {
    base_dodge += parseInt(member.adj_agility / 16, 10);
  }
  member.adj_dodge = calculateStatBoost('dodge', base_dodge, data, member);
  member.adj_dodge = Math.max(member.adj_dodge, 0);

  if (applyEffects) {
    // Need to require this file during execution since it is not available globally yet
    var Action = require(__dirname + '/action');
    var action = new Action();
    _.each(member.effects, function (effect) {
      action.set(effect, data);
      if (action.is_set) {
        action.applyPreviousEffect(member, data.RNG);
      }
    });
  }
}

// Returns the display name for a given stat
function statDisplayName (stat) {
  var displayName;

  if (_.includes(['base_HP', 'curr_HP', 'max_HP'], stat)) {
    displayName = 'HP';
  } else if (_.includes(['base_MP', 'curr_MP', 'max_MP'], stat)) {
    displayName = 'MP';
  } else if (_.includes(['base_strength', 'adj_strength', 'curr_strength'], stat)) {
    displayName = 'STR';
  } else if (_.includes(['base_agility', 'adj_agility', 'curr_agility'], stat)) {
    displayName = 'AGI';
  } else if (_.includes(['attack', 'curr_attack'], stat)) {
    displayName = 'ATK';
  } else if (_.includes(['defense', 'curr_defense'], stat)) {
    displayName = 'DEF';
  }

  return displayName;
}

// return function name for a given display name
function toFunctionName (name) {
  return name.replace(/[\s']/g, '').replace(/-/g, '_');
}
