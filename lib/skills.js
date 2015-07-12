var battleHelpers = require(__dirname + '/battle_helpers');
var nconf         = require('nconf');
var _             = require('lodash');

var internals = {};

module.exports = internals.Skill = function (skill, skill_list) {
  if (_.isString(skill) && _.isArray(skill_list)) {
    skill = this.findSkill(skill, skill_list);
  }

  if (_.isPlainObject(skill)) {
    _.assign(this, skill);
    this.has_skill = true;
  }
};

// applies the effects of a previously used skill to a target
internals.Skill.prototype.applyPreviousEffect = function applyPreviousEffect(target) {
  var max_stat = nconf.get('max_stat');
  var value;

  if (this.has_skill) {
    // only buffs and debuffs have a persisting skill effect.
    switch (this.type) {
      case 'buff':
        if (this.stat_from && this.stat_to) {
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
          console.log('before: ' + target[this.stat_to] + '  after: ' + (target[this.stat_to] + value));
          target[this.stat_to] += value;
        }
        break;
      case 'debuff':
        if (this.stat_from && this.stat_to) {
          // calculate the stat decrease amount
          if (this.minimum && this.range) {
            value = parseInt(this.minimum + RNG.integer(0, this.range), 10) || 0;
          } else {
            value = parseInt(target[this.stat_from] * this.multiplier, 10) || 0;
          }
          // do not allow the decrease to put this stat below zero
          value = Math.min(value, target[this.stat_to]);
          console.log('before: ' + target[this.stat_to] + ' after: ' + (target[this.stat_to] - value));
          target[this.stat_to] -= value;
        }
        break;
      default:
        break;
    }
  }
};

// clears the current skill from this object
internals.Skill.prototype.clearSkill = function clearSkill() {
  var keys = _.keys(this);
  for (var i = 0; i < keys.length; i++) {
    delete this[keys[i]];
  }
  this.has_skill = false;
};

// returns the skill data for a skill name passed in
internals.Skill.prototype.findSkill = function findSkill(skill_name, skill_list) {
  skill_name = (skill_name || '').toLowerCase();

  var skill = _.find(skill_list, function (curr_skill) {
    if (curr_skill.name) {
      return (curr_skill.name.toLowerCase() === skill_name);
    }
  });

  return skill;
};

// returns the target(s) for this skill
internals.Skill.prototype.findTargets = function findTargets(scenario, member) {
  var target  = member.command.target;
  var targets = [];

  function pushTarget (curr_target) {
    targets.push(curr_target);
  }

  switch (this.target) {
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
    case 'none':
      break;
    default:
      throw new Error('Unknown skill target type ' + this.target);
      break;
  }

  return targets;
};

// sets the skill object with a new type of skill
internals.Skill.prototype.setSkill = function setSkill(skill, skill_list) {
  this.clearSkill();

  if (_.isString(skill) && _.isArray(skill_list)) {
    skill = this.findSkill(skill, skill_list);
  }

  if (_.isPlainObject(skill)) {
    _.assign(this, skill);
    this.has_skill = true;
  }
};

// performs the currently set skil and returns the battle message
internals.Skill.prototype.useSkill = function useSkill(scenario, member, targets, RNG) {
  var message = '';

  // first, check for override function
  var overrideFunction = 'use' + this.name.replace(/\s/g, '').replace(/-/g, '_');
  if (typeof this[overrideFunction] === 'function') {
    message = this[overrideFunction](scenario, member, targets, RNG);
    return message;
  }

  // TODO: otherwise, perform skill

  return message;
};

// custom override for Open Up skill
internals.Skill.prototype.useOpenUp = function useOpenUp(scenario, member, targets, RNG) {
  var message = '';
  var amount;

  if (RNG.bool()) {
    // weapon upgrade * 1.375 ATK
    amount = parseInt(member.curr_attack * 0.375, 10);
    member.curr_attack += amount;
    member.effects.push('Open Up-A');
    message += 'Found a weapon! +' + amount + ' ATK.';

  } else {
    // armor upgrade * 1.5 DEF
    amount = parseInt(member.curr_defense * 0.5, 10);
    member.curr_defense += amount;
    member.effects.push('Open Up-D');
    message += 'Found a shield! +' + amount + ' DEF.';
  }

  return message;
};
