var _ = require('lodash');

module.exports = {
  calculateAdjustedStat : calculateAdjustedStat,
  calculateSaver        : calculateSaver,
  checkLevel            : checkLevel,
  fixData               : fixData
};

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

// Checks a character's level based on job class and current experience
function checkLevel (XPTable, job, experience) {
  var level = 1 + _.findLastIndex(XPTable[job], function (num) {
    return num <= experience;
  });

  return level;
}

// Given a base stat, add in stat boosts from equipped items
function calculateAdjustedStat (stat_name, base_stat, data, character) {
  var adj_stat   = base_stat;
  var stat_boost = 0;
  var multiplier = 1;

  function addBoost (value) {
    if (typeof value === 'number') {
      stat_boost += value;
    } else if (/^\*/.test(value)) {
      value = parseFloat(value.replace('*', ''), 10);
      multiplier = (isNaN(value)) ? multiplier : parseFloat(multiplier * value, 10);
      console.log('value: ' + value + '   multiplier: ' + multiplier);
    }
  }
  
  _.each(character.equip, function (name, key) {
    var item = _.find(data[key], { name : name });
    // if the item has a stat boost and it can be equipped by this character
    if (item && item[stat_name] && item.equip && item.equip[character.job]) {
      addBoost(item[stat_name]);
    }
  });

  _.each(character.inventory, function (name) {
    var accessory;
    // items marked with "E:" are equipped accessories
    if (/^E:/.test(name)) {
      name = name.replace('E:', '');
      accessory = _.find(data.accessory, { name : name });
      if (accessory && accessory[stat_name] && accessory.equip && accessory.equip[character.job]) {
        addBoost(accessory[stat_name]);
      }
    }
  });

  var heart = _.find(data.heart, { name : character.heart.name });
  if (heart && heart[stat_name]) {
    addBoost(heart[stat_name]);
  }

  // multiply the base stat first, then add the static boosts
  adj_stat = parseInt(adj_stat * multiplier, 10);
  adj_stat += stat_boost;

  return adj_stat;
}

// Does the given character have a particular SAVER skill?
// TODO: make generic so it can return any boolean value (CURSED)
function calculateSaver (saver_name, data, character) {
  var hasSaver = false;

  _.each(character.equip, function (name, key) {
    var item = _.find(data[key], { name : name });
    // if the item has a SAVER and it can be equipped by this character
    if (item && item.saver && item.saver[saver_name]) {
      if (item.equip && item.equip[character.job]) {
        hasSaver = true;

        // since we have a SAVER, break out of the loop
        return false;
      }
    }
  });

  if (!hasSaver) {
    _.each(character.inventory, function (name) {
      var accessory;
      // items marked with "E:" are equipped accessories
      if (/^E:/.test(name)) {
        name = name.replace('E:', '');
        accessory = _.find(data.accessory, { name : name });
        if (accessory && accessory.saver && accessory.saver[saver_name]) {
          if (accessory.equip && accessory.equip[character.job]) {
            hasSaver = true;

            // since we have a SAVER, break out of the loop
            return false;
          }
        }
      }
    });
  }

  if (!hasSaver) {
    var heart = _.find(data.heart, { name : character.heart.name });
    if (heart && heart.saver && heart.saver[saver_name]) {
      hasSaver = true;
    }
  }

  return hasSaver;
}
