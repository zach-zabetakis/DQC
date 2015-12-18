var Action        = require(__dirname + '/action');
var battleHelpers = require(__dirname + '/battle_helpers');
var AI            = require(__dirname + '/ai_helpers')(battleHelpers);
var helpers       = require(__dirname + '/helpers');
var Skill         = require(__dirname + '/skills');
var Spell         = require(__dirname + '/spells');
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
  var overrideFunction = 'use' + helpers.toFunctionName(this.name);
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
          if (battleHelpers.isDefending(target)) {
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
                message += battleHelpers.defeated(DQC, target, member);
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
                message += battleHelpers.defeated(DQC, target, member, true);
                battleHelpers.updateActiveGroups(scenario, battleHelpers.groupType(target));
              }
            }
          } else {
            message += msgFizzle;
          }
          break;
        case 'buff':
          // certain items can only be applied once
          if (this.status && _.includes(member.status, this.status)) {
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
                  message += battleHelpers.defeated(DQC, target, member, true);
                  battleHelpers.updateActiveGroups(scenario, battleHelpers.groupType(target));
                }
              }
            }
          } else {
            message += msgFizzle;
          }
          break;
        case 'travel':
          // travel items all have custom effects
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

// custom override for Acorns of Life
Item.prototype.useAcornsofLife = function useAcornsofLife(DQC, scenario, member, targets) {
  var amount  = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
  var target  = targets[0];
  var message = '';

  // stat increase only works for player characters
  if (target.type === 'character') {
    target.base_HP += amount;
    helpers.recalculateStats(DQC.data, target, true);
    message = target.displayName() + ': Max HP +' + amount;

  } else {
    message = 'but nothing happens.';
  }

  return message;
};

// custom override for AGI Seed
Item.prototype.useAGISeed = function useAGISeed(DQC, scenario, member, targets) {
  var amount   = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
  var max_stat = nconf.get('max_stat');
  var target   = targets[0];
  var message  = '';

  // stat increase only works for player characters
  if (target.type === 'character') {
    target.base_agility += amount;
    helpers.recalculateStats(DQC.data, target, true);
    message = target.displayName() + ': AGI +' + amount;

  } else {
    message = 'but nothing happens.';
  }

  return message;
};

// custom override for Eau de Slime
Item.prototype.useEaudeSlime = function useEaudeSlime(DQC, scenario, member, targets) {
  var slimes     = ['Slime', 'Red Slime'];
  var index      = DQC.RNG.integer(0, slimes.length - 1);
  var slimeClone = _.cloneDeep(_.find(DQC.data.monster, { name : slimes[index] }));
  var code       = 65; // symbols start at 'A'
  var message    = '';
  var slime;

  if (slimeClone) {
    slimeClone.is_enemy = false;
    message += 'A horde of ' + slimeClone.name + 's appear!';
    for (var i = 0; i < 8; i++) {
      slime = _.cloneDeep(slimeClone);
      slime.symbol  = String.fromCharCode(code + i);
      AI.chooseCommand(DQC, scenario, slime);
      message += "\n" + battleHelpers.performCommand(DQC, scenario, slime);
    }
    message += "\nThe " + slimeClone.name + 's vanish.';
  }

  return message;
};

// custom override for Eau de Uberslime
Item.prototype.useEaudeUberslime = function useEaudeUberslime(DQC, scenario, member, targets) {
  var slimes     = ['Drakslime', 'Fangslime', 'Ghostslime', 'Snaily'];
  var index      = DQC.RNG.integer(0, slimes.length - 1);
  var slimeClone = _.cloneDeep(_.find(DQC.data.monster, { name : slimes[index] }));
  var code       = 65; // symbols start at 'A'
  var message    = '';
  var slime;

  if (slimeClone) {
    slimeClone.is_enemy = false;
    message += 'A horde of ' + slimeClone.name + 's appear!';
    for (var i = 0; i < 8; i++) {
      slime = _.cloneDeep(slimeClone);
      slime.symbol  = String.fromCharCode(code + i);
      AI.chooseCommand(DQC, scenario, slime);
      message += "\n" + battleHelpers.performCommand(DQC, scenario, slime);
    }
    message += "\nThe " + slimeClone.name + 's vanish.';
  }

  return message;
};

// custom override for Eau de Ultraslime
Item.prototype.useEaudeUltraslime = function useEaudeUltraslime(DQC, scenario, member, targets) {
  var slimes     = ['Boxslime', 'Marine Slime', 'Treeslime', 'Zomslime'];
  var index      = DQC.RNG.integer(0, slimes.length - 1);
  var slimeClone = _.cloneDeep(_.find(DQC.data.monster, { name : slimes[index] }));
  var code       = 65; // symbols start at 'A'
  var message    = '';
  var slime;

  if (slimeClone) {
    slimeClone.is_enemy = false;
    message += 'A horde of ' + slimeClone.name + 's appear!';
    for (var i = 0; i < 8; i++) {
      slime = _.cloneDeep(slimeClone);
      slime.symbol  = String.fromCharCode(code + i);
      AI.chooseCommand(DQC, scenario, slime);
      message += "\n" + battleHelpers.performCommand(DQC, scenario, slime);
    }
    message += "\nThe " + slimeClone.name + 's vanish.';
  }

  return message;
};

// custom override for Full Moon Herb
Item.prototype.useFullMoonHerb = function useFullMoonHerb(DQC, scenario, member, targets) {
  var target  = targets[0] || {};
  var message = '';

  if (battleHelpers.isTargetable(target)) {
    message += target.displayName() + ': ';

    if (_.includes(target.status, 'IR') || !_.intersection(target.status, ['CF', 'NU']).length) {
      message += 'no effect.';
      return message;
    }

    if (_.includes(target.status, 'NU')) {
      message += battleHelpers.cureStatus('NU', target) + ' ';
    }
    if (_.includes(target.status, 'CF')) {
      message += battleHelpers.cureStatus('CF', target);
    }
  }

  return message.trim();
};

// custom override for La Stranga Taso
Item.prototype.useLaStrangaTaso = function useLaStrangaTaso(DQC, scenario, member, targets) {
  var options = ['Fire Breath', 'Flaming Breath', 'Chaos Breath', 'Poison Breath', 'Numb Breath', 'Sleep Breath', 'Sap Breath', 'Healing Breath'];
  var index   = DQC.RNG.integer(0, options.length - 1);
  var skill   = new Skill(options[index], DQC.data);
  var message = '';

  // if healing breath, retarget to original user and all allies
  if (options[index] === 'Healing Breath') {
    member.command.target = member;
    targets = this.getTargets(scenario, member);
  }

  if (skill.is_set) {
    if (DQC.RNG.bool(skill.miss, 32)) {
      message += 'But nothing happens.';
    } else {
      message += skill.displayMessage(member.displayName());
      message += ' ' + skill.useSkill(DQC, scenario, member, targets);
    }
  }

  return message;
};

// custom override for Mystic Nuts
Item.prototype.useMysticNuts = function useMysticNuts(DQC, scenario, member, targets) {
  var amount  = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
  var target  = targets[0];
  var message = '';

  // stat increase only works for player characters
  if (target.type === 'character') {
    target.base_MP += amount;
    helpers.recalculateStats(DQC.data, target, true);
    message = target.displayName() + ': Max MP +' + amount;

  } else {
    message = 'but nothing happens.';
  }

  return message;
};

// custom override for Ranger's Ring
Item.prototype.useRangersRing = function useRangersRing(DQC, scenario, member, targets) {
  var dispName = member.displayName();
  var target   = member.command.target;
  var spell    = new Spell();
  var results  = {};
  var message  = 'Time slows...';

  // 1) Physical attack
  message += '\n' + dispName + ' attacks!';
  if (battleHelpers.isTargetable(target)) {
    message += ' ' + target.displayName() + ': ';
    
    if (_.includes(target.status, 'IR')) {
      message += 'no effect.';

    } else {
      results = battleHelpers.singleTargetAttack(DQC, member, target);
      message += battleHelpers.applyAttackResults(results, DQC, scenario, member, target);
    }
  }

  // 2) Sleep spell
  member.level >= 17 ? spell.setSpell('Sleepmore', DQC.data) : spell.setSpell('Sleep', DQC.data);
  if (spell.is_set) {
    message += '\n' + spell.displayMessage(dispName);
    message += ' ' + spell.castSpell(DQC, scenario, member, targets);
  }

  // 3) Heal spell (self-heal)
  member.level >= 17 ? spell.setSpell('Healmore', DQC.data) : spell.setSpell('Heal', DQC.data);
  if (spell.is_set) {
    message += '\n' + spell.displayMessage(dispName);
    message += ' ' + spell.castSpell(DQC, scenario, member, [member]);
  }

  message += '\nTime snaps back to normal.';
  return message;
};

// custom override for STR Seed
Item.prototype.useSTRSeed = function useSTRSeed(DQC, scenario, member, targets) {
  var amount   = parseInt(this.minimum + DQC.RNG.integer(0, this.range), 10) || 0;
  var max_stat = nconf.get('max_stat');
  var target   = targets[0];
  var message  = '';

  // stat increase only works for player characters
  if (target.type === 'character') {
    target.base_strength += amount;
    helpers.recalculateStats(DQC.data, target, true);
    message = target.displayName() + ': STR +' + amount;

  } else {
    message = 'but nothing happens.';
  }

  return message;
};

// custom override for Torch
Item.prototype.useTorch = function useTorch(DQC, scenario, member, targets) {
  var message = '';

  if (scenario.light_level !== null) {
    message = 'Light fills the area.';
    scenario.light_level = 1;

  } else {
    message = 'no effect.';
  }

  return message;
};
