var battleHelpers = require(__dirname + '/battle_helpers');
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
  // TODO: first, check for override function
  // TODO: then, perform skill
};
