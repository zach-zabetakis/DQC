var battleHelpers = require(__dirname + '/battle_helpers');
var helpers       = require(__dirname + '/helpers');
var nconf         = require('nconf');
var _             = require('lodash');

var internals = {};

// base class for actions such as casting spells, performing skills, or using items
module.exports = internals.Action = function () {
  this.is_set = false;
};

// clears the current action from this object
internals.Action.prototype.clear = function clear() {
  var keys = _.keys(this);
  for (var i = 0; i < keys.length; i++) {
    delete this[keys[i]];
  }
  this.is_set = false;
};

// applies the effects of a previously used action to a target
internals.Action.prototype.applyPreviousEffect = function applyPreviousEffect(target, RNG) {
  var max_stat = nconf.get('max_stat');
  var value;

  if (this.is_set) {
    // only buffs and debuffs have a persisting effect.
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

// determine an appropriate target for this action
// if a target cannot be found return undefined
internals.Action.prototype.chooseTarget = function chooseTarget(DQC, scenario, member) {
  var targetSelf = DQC.RNG.bool(3, 4);
  var target;

  switch (this.type) {
    case 'healing':
      target = targetingLogicHealing(DQC, scenario, member);
      break;
    case 'revival':

      break;
    case 'physical':

      break;
    case 'offensive':

      break;
    case 'status':

      break;
    case 'buff':

      break;
    case 'debuff':

      break;
    case 'travel':

      break;
    default:

      break;
  }

  return target;
};

// returns the data for an action name passed in
internals.Action.prototype.find = function find(name, data) {
  if (!name) { return undefined; }
  name = (name || '').toLowerCase();

  var found = false;
  var result;

  function findCaseInsensitive (search) {
    if (search.name) {
      return (search.name.toLowerCase() === name);
    }
  }

  result = _.find(data.spell, findCaseInsensitive);
  if (result) { return result; }
  result = _.find(data.skill, findCaseInsensitive);
  if (result) { return result; }
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

// returns the target(s) for this action
internals.Action.prototype.getTargets = function getTargets(scenario, member) {
  var target  = member.command.target;
  var targets = [];

  function pushTarget (curr_target) {
    targets.push(curr_target);
  }

  this.target = this.target || 'none';
  switch (this.target) {
    case 'none':
      break;
    case 'self':
      pushTarget(member);
      break;
    case 'single':
      if (target.is_dead && this.shouldRetarget() && member.is_aware !== false) {
        member.command.target = target = battleHelpers.retarget(scenario, target);
      }
      if (!scenario.battle.has_fronts || battleHelpers.isSameFront(member.front, target.front)) {
        pushTarget(target);
      }
      break;
    case 'group':
      var target_group = battleHelpers.groupType(target);
      target_group = _.findValue(scenario, 'battle.' + target_group + '.groups.' + target.group_index, {});
      if (!scenario.battle.has_fronts || battleHelpers.isSameFront(member.front, target_group.front)) {
        _.each(target_group.members, pushTarget);
      }
      break;
    case 'all':
      if (target.is_enemy) {
        _.each(scenario.battle.enemies.groups, function (group) {
          if (!scenario.battle.has_fronts || battleHelpers.isSameFront(member.front, group.front)) {
            _.each(group.members, pushTarget);
          }
        });
      } else {
        _.each(scenario.battle.characters.groups, function (group) {
          if (!scenario.battle.has_fronts || battleHelpers.isSameFront(member.front, group.front)) {
            _.each(group.members, pushTarget);
          }
        });
        _.each(scenario.battle.allies.groups, function (group) {
          if (!scenario.battle.has_fronts || battleHelpers.isSameFront(member.front, group.front)) {
            _.each(group.members, pushTarget);
          }
        });
      }
      break;
    default:
      throw new Error('Unknown target type ' + this.target);
      break;
  }

  return targets;
};

// sets an action by finding the first spell, skill, or item with a matching name
internals.Action.prototype.set = function set(action, data) {
  this.clear();

  if (_.isString(action) && _.isPlainObject(data)) {
    action = this.find(action, data);
  }

  if (_.isPlainObject(action)) {
    _.assign(this, action);
    this.is_set = true;
  }
};

// determines whether or not an action retargets if the initial target is dead
internals.Action.prototype.shouldRetarget = function shouldRetarget() {
  var retargetTypes = ['debuff', 'offensive', 'physical', 'status'];
  var retarget = _.includes(retargetTypes, this.type);
  return retarget;
};

// specific targeting logic for healing type actions
internals.Action.prototype.targetingLogicHealing = function targetingLogicHealing (DQC, scenario, member) {
  var targetSelf = DQC.RNG.bool(3, 4);
  var memberPool;
  var target;

  function testHPthreshold (candidate) {
    // do not heal unless HP < 85% of max
    return (parseInt(candidate.max_HP * 0.85, 10) > candidate.curr_HP);
  }

  if (targetSelf && testHPthreshold(member)) {
    target = member;
  }

  // find member most in need of healing
  if (!target) {
    if (member.is_enemy) {
      memberPool = battleHelpers.getAllMembers(scenario, 'enemies', member.front);
    } else {
      memberPool = battleHelpers.getAllMembers(scenario, 'characters', member.front);
      memberPool.concat(battleHelpers.getAllMembers(scenario, 'allies', member.front));
    }

    memberPool = _.filter(memberPool, battleHelpers.isTargetable);
    if (memberPool.length) {
      target = _.sortBy(memberPool, function (member) {
        return parseFloat(member.curr_HP / member.max_HP);
      }).shift();

      if (!testHPthreshold(target)) {
        target = undefined;
      }
    }
  }

  return target;
};
