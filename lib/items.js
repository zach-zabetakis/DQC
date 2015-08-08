var battleHelpers = require(__dirname + '/battle_helpers');
var helpers       = require(__dirname + '/helpers');
var nconf         = require('nconf');
var _             = require('lodash');

var internals = {};

// Used for both consumable items and equipment that is being USED in battle
module.exports = internals.Item = function (item, data) {
  this.setItem(item, data);
};

// applies the effects of a previously used item to a target
internals.Item.prototype.applyPreviousEffect = function applyPreviousEffect(target, RNG) {
  var max_stat = nconf.get('max_stat');
  var value;

  if (this.has_item) {
    // only buffs and debuffs have a persisting skill effect.
    switch (this.persist) {
      case 'buff':
        if (this.stat_to) {
          // calculate the stat increase amount
          if (this.minimum && this.range) {
            value = parseInt(this.minimum + RNG.integer(0, this.range), 10) || 0;
          } else {
            value = parseInt(target[this.stat_from] * this.multiplier, 10) || 0;
          }
          // do not allow the increase to put us over the stat cap
          if (max_stat[this.stat_to]) {
            value = Math.min(value, max_stat[this.stat_to] - target[this.stat_to]);
          }
          // add the stat increase to the target stat
          target[this.stat_to] += value;
        }
        break;
      case 'debuff':
        if (this.stat_to) {
          // calculate the stat decrease amount
          if (this.minimum && this.range) {
            value = parseInt(this.minimum + RNG.integer(0, this.range), 10) || 0;
          } else {
            value = parseInt(target[this.stat_from] * this.multiplier, 10) || 0;
          }
          // do not allow the decrease to put this stat below zero
          value = Math.min(value, target[this.stat_to]);
          target[this.stat_to] -= value;
        }
        break;
      default:
        break;
    }
  }
};

// clears the current item from this object
internals.Item.prototype.clearItem = function clearItem() {
  var keys = _.keys(this);
  for (var i = 0; i < keys.length; i++) {
    delete this[keys[i]];
  }
  this.has_item = false;
};

// returns the message that is displayed when this item is used
internals.Item.prototype.displayMessage = function displayMessage(displayName) {
  var message = displayName + ' uses the ' + this.name + '!';
  return message;
};

// returns the item data for an item name passed in
internals.Item.prototype.findItem = function findItem(item_name, data) {
  if (!item_name) { return undefined; }
  var found = false;
  var result;

  result = _.find(data.item, { name : item_name });
  if (result) {
    // set an extra flag to indicate that this is an actual item
    result.is_item = true;
    return result;
  }
  result = _.find(data.accessory, { name : item_name });
  if (result) { return result; }
  result = _.find(data.armor, { name : item_name });
  if (result) { return result; }
  result = _.find(data.helmet, { name : item_name });
  if (result) { return result; }
  result = _.find(data.shield, { name : item_name });
  if (result) { return result; }
  result = _.find(data.weapon, { name : item_name });

  return result;
};

// returns the target(s) for this item
internals.Item.prototype.findTargets = function findTargets(scenario, member) {
  var target  = member.command.target;
  var targets = [];

  function pushTarget (curr_target) {
    targets.push(curr_target);
  }

  switch (this.target) {
    case 'none':
      break;
    case 'self':
      pushTarget(member);
      break;
    case 'single':
      pushTarget(target);
      break;
    case 'group':
      var target_group = battleHelpers.groupType(target);
      target_group = _.findValue(scenario, 'battle.' + target_group + '.groups.' + target.group_index, {});
      _.each(target_group.members, pushTarget);
      break;
    case 'all':
      if (target.is_enemy) {
        _.each(scenario.battle.enemies.groups, function (group) {
          _.each(group.members, pushTarget);
        });
      } else {
        _.each(scenario.battle.characters.groups, function (group) {
          _.each(group.members, pushTarget);
        });
        _.each(scenario.battle.allies.groups, function (group) {
          _.each(group.members, pushTarget);
        });
      }
      break;
    default:
      throw new Error('Unknown skill target type ' + this.target);
      break;
  }

  return targets;
};

// returns true if a member is in possession of the current item
internals.Item.prototype.hasItem = function hasItem(member) {
  if (!member) { return this.has_item; }

  var item_name = this.name;
  var found     = false;

  _.each(member.inventory, function (item) {
    if (item_name === item.replace(/^E:/, '')) {
      found = true;
      return false;
    }
  });

  if (found) { return true; }

  _.each(member.equip, function (equip) {
    if (item_name === equip) {
      found = true;
      return false;
    }
  });

  return found;
};

// sets the item object with a new type of item
internals.Item.prototype.setItem = function setItem(item, data) {
  this.clearItem();

  if (_.isString(item) && _.isPlainObject(data)) {
    item = this.findItem(item, data);
  }

  if (_.isPlainObject(item)) {
    _.assign(this, item);
    this.has_item = true;
    this.target = this.target || 'none';
  }
};

// uses the currently set item and returns the battle message
internals.Item.prototype.useItem = function useItem(item, data) {
  // TODO
};
