var _ = require('lodash');

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
