var Action        = require(__dirname + '/action');
var battleHelpers = require(__dirname + '/battle_helpers');
var helpers       = require(__dirname + '/helpers');
var nconf         = require('nconf');
var _             = require('lodash');

// Used for both consumable items and equipment that is being USED in battle
module.exports = Item;

function Item (item, data) {
  this.setItem(item, data);
}

Item.prototype = new Action();

// clears the current item from this object
Item.prototype.clearItem = Item.prototype.clear;

// returns the message that is displayed when this item is used
Item.prototype.displayMessage = function displayMessage(displayName) {
  var message = displayName + ' uses the ' + this.name + '!';
  return message;
};

// returns the item data for an item name passed in
Item.prototype.find = function find(item_name, data) {
  if (!item_name) { return undefined; }
  item_name = (item_name || '').toLowerCase();

  var found = false;
  var result;

  function findCaseInsensitive (search) {
    if (search.name) {
      return (search.name.toLowerCase() === item_name);
    }
  }

  result = _.find(data.item, findCaseInsensitive);
  if (result) {
    // set an extra flag to indicate that this is an actual item
    result.is_item = true;
    return result;
  }
  result = _.find(data.accessory, findCaseInsensitive);
  if (result) { return result; }
  result = _.find(data.armor, findCaseInsensitive);
  if (result) { return result; }
  result = _.find(data.helmet, findCaseInsensitive);
  if (result) { return result; }
  result = _.find(data.shield, findCaseInsensitive);
  if (result) { return result; }
  result = _.find(data.weapon, findCaseInsensitive);

  return result;
};

// alias for find
Item.prototype.findItem = Item.prototype.find;

// returns true if a member is in possession of the current item
Item.prototype.hasItem = function hasItem(member) {
  if (!member) { return this.is_set; }

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
Item.prototype.setItem = Item.prototype.set;

// uses the currently set item and returns the battle message
Item.prototype.useItem = function useItem(item, data) {
  // TODO
};
