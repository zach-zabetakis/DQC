var nconf = require('nconf');
var _     = require('lodash');

module.exports = {
  calculateStatBoost : calculateStatBoost,
  fixData            : fixData,
  format             : format,
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

// Formats a message
function format (message, bold, italic) {
  var btag = '<b>', bend = '</b>';
  var itag = '<i>', iend = '</i>';
  var html = nconf.get('html');

  if (bold && html)   { message = btag + message + bend }
  if (italic && html) { message = itag + message + iend }

  return message;
}
