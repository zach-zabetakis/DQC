var _ = require('lodash');

module.exports = {
  calculateAdjustedStat : calculateAdjustedStat,
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
  var adj_stat = base_stat;

  _.each(character.equip, function (name, key) {
    var item = _.find(data[key], { name : name });
    // if the item has a stat boost and it can be equipped by this character
    if (item && item[stat_name] && item.equip && item.equip[character.job]) {
      adj_stat += item[stat_name];
    }
  });

  _.each(character.inventory, function (name) {
    var accessory;
    // items marked with "E:" are equipped accessories
    if (/^E:/.test(name)) {
      name = name.replace('E:', '');
      accessory = _.find(data.accessory, { name : name });
      if (accessory && accessory[stat_name] && accessory.equip && accessory.equip[character.job]) {
        adj_stat += accessory[stat_name];
      }
    }
  });

  var heart = _.find(data.heart, { name : character.heart.name });
  if (heart && heart[stat_name]) {
    adj_stat += heart[stat_name];
  }

  return adj_stat;
}
