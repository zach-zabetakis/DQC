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

// removes an item from a member's inventory
Item.prototype.removeItem = function removeItem(member) {
  var item_name = this.name;
  var index     = _.findIndex(member.inventory, function (item) {
    return item === item_name;
  });
  if (index !== -1) {
    member.inventory.splice(index, 1);
  }
};

// sets the item object with a new type of item
Item.prototype.setItem = Item.prototype.set;

// uses the currently set item and returns the battle message
Item.prototype.useItem = function useItem(DQC, scenario, member, targets) {
  var max_stat  = nconf.get('max_stat');
  var saver     = battleHelpers.getSaver(this.resist);
  var messages  = [];
  var message   = '';
  var msgFizzle = 'Resisted!';
  var msgSaved  = 'Saved!';
  var msgNone   = 'no effect.';
  var target;
  var resist;
  var amount;
  var stat;

  // first, check for override function
  var overrideFunction = 'use' + this.name.replace(/[\s']/g, '').replace(/-/g, '_');
  if (typeof this[overrideFunction] === 'function') {
    message = this[overrideFunction](DQC, scenario, member, targets);
    return message;
  }

  // message for cases with no targets
  if (!targets.length) {
    return 'but nothing happens.';
  }

  // otherwise, use the item
  for (var i = 0; i < targets.length; i++) {
    target  = targets[i];
    message = target.displayName() + ': ';

    if (battleHelpers.isTargetable(target) || (target.is_dead && this.type === 'revival')) {
      if (_.includes(target.status, 'IR')) {
        message += msgNone;
        messages.push(message.trim());
        continue;
      }

      resist = target.resist[this.resist] || 0;

      switch (this.type) {
        case 'healing':
          amount = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
          if (amount) {
            // healing refers to HP by default but can also restore MP
            if (/MP/.test(this.stat_to)) {
              target.curr_MP += amount;
              battleHelpers.checkMP(target);
              message += '+' + amount + 'MP.';
            } else {
              battleHelpers.healDamage(scenario, target, amount);
              message += '+' + amount + ' HP. ';
            }
          }

          if (this.status) {
            message += battleHelpers.cureStatus(this.status, target);
          }
          break;
        case 'revival':
          if (target.is_dead) {
            message += battleHelpers.cureStatus('DE', target);
            
            // cureStatus sets HP at 1; subtract an additional 1 to heal correct amount
            amount = parseInt(target[this.stat_from] * this.multiplier, 10) || 1;
            amount = (amount - 1);
            battleHelpers.healDamage(scenario, target, amount);
            battleHelpers.updateActiveGroups(scenario, battleHelpers.groupType(target));

          } else {
            message += msgNone;
          }
          break;
        case 'offensive':
          amount = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
          if (target.parry) {
            amount = parseInt(amount / 2, 10);
          }
          // check for resistance/saver
          if (!DQC.RNG.bool(resist, 16)) {
            if (saver && target.saver[saver] && DQC.RNG.bool(1, 4)) {
              message += msgSaved;
            } else {
              battleHelpers.takeDamage(scenario, target, amount);
              message += '-' + amount + ' HP.';
              if (target.is_dead) {
                target.defeated_by = member.displayName();
                message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : ' - Defeated!';
              }
            }
          } else {
            message += msgFizzle;
          }
          break;
        case 'status':
          // check for resistance/saver
          if (!DQC.RNG.bool(resist, 16)) {
            if (saver && target.saver[saver] && DQC.RNG.bool(1, 4)) {
              message += msgSaved;
            } else {
              message += battleHelpers.applyStatus(this.status, target);
              if (target.is_dead) {
                target.defeated_by = member.displayName();
                message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : '';
              }
            }
          } else {
            message += msgFizzle;
          }
          break;
        case 'buff':
          // certain items can only be applied once
          if (_.includes([], this.name) && _includes(member.effects, this.name)) {
            message += msgNone;

          } else {
            if (this.stat_from && this.stat_to) {
              // calculate the stat increase amount
              if (this.minimum && this.range) {
                amount = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
              } else {
                amount = parseInt(target[this.stat_from] * this.multiplier, 10) || 0;
              }

              // do not allow the increase to put us over the stat cap
              if (max_stat[this.stat_to]) {
                amount = Math.min(amount, max_stat[this.stat_to] - target[this.stat_to]);
              }

              target[this.stat_to] += amount;
              stat = helpers.statDisplayName(this.stat_to);
              message += '+' + amount + ' ' + stat + '. ';
              
            }
            if (this.status) {
              message += battleHelpers.applyStatus(this.status, target);
            }
          }
          break;
        case 'debuff':
          // check for resistance/saver
          if (!DQC.RNG.bool(resist, 16)) {
            if (saver && target.saver[saver] && DQC.RNG.bool(1, 4)) {
              message += msgSaved;

            } else {
              if (this.stat_from && this.stat_to) {
                // calculate the stat decrease amount
                if (this.minimum && this.range) {
                  amount = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
                } else {
                  amount = parseInt(target[this.stat_from] * this.multiplier, 10) || 0;
                }

                // do not allow the decrease to put this stat below zero
                amount = Math.min(amount, target[this.stat_to]);
                target[this.stat_to] -= amount;

                stat = helpers.statDisplayName(this.stat_to);
                message += '-' + amount + ' ' + stat + '. ';
              }
              if (this.status) {
                message += battleHelpers.applyStatus(this.status, target);
                if (target.is_dead) {
                  target.defeated_by = member.displayName();
                  message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : '';
                }
              }
            }
          } else {
            message += msgFizzle;
          }
          break;
        case 'none':
          message += 'but nothing happens.';
          break;
        default:
          throw new Error('Unknown item type ' + this.type);
          break;
      }

      // if skill has a persisting effect, add it to effects list
      if (this.persist) {
        target.effects.push(this.name);
      }

      messages.push(message.trim());
    }
  }

  return messages.join(' ');
};
