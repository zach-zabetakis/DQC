var characterHelpers = require(__dirname + '/character_helpers');
var formulas         = require(__dirname + '/formulas');
var helpers          = require(__dirname + '/helpers');
var lottery          = require(__dirname + '/lottery');
var nconf            = require('nconf');
var _                = require('lodash');

var battleHelpers = module.exports = {
  applyAttackResults    : applyAttackResults,
  applyOnHitEffects     : applyOnHitEffects,
  applyStatus           : applyStatus,
  calculateNextSymbol   : calculateNextSymbol,
  checkHP               : checkHP,
  checkMP               : checkMP,
  checkStatusRecovery   : checkStatusRecovery,
  chooseEnemyTarget     : chooseEnemyTarget,
  clearBattleEffects    : clearBattleEffects,
  createNewGroup        : createNewGroup,
  cureStatus            : cureStatus,
  defeated              : defeated,
  endOfBattle           : endOfBattle,
  endOfTurn             : endOfTurn,
  expelFromBattle       : expelFromBattle,
  findMember            : findMember,
  findByHighestStat     : findByHighestStat,
  generateTurnOrder     : generateTurnOrder,
  getAllGroups          : getAllGroups,
  getAllMembers         : getAllMembers,
  getMultiplier         : getMultiplier,
  getSaver              : getSaver,
  groupType             : groupType,
  healDamage            : healDamage,
  isActive              : isActive,
  isDefending           : isDefending,
  isIncapacitated       : isIncapacitated,
  isPlayerWipeout       : isPlayerWipeout,
  isRemaining           : isRemaining,
  isSameFront           : isSameFront,
  isTargetable          : isTargetable,
  joinBattle            : joinBattle,
  performCommand        : performCommand,
  poison                : poison,
  regenHP               : regenHP,
  resetFormation        : resetFormation,
  retarget              : retarget,
  separateIntoFronts    : separateIntoFronts,
  simulateCharacterTurn : simulateCharacterTurn,
  simulateMonsterTurn   : simulateMonsterTurn,
  simulateNPCTurn       : simulateNPCTurn,
  singleTargetAttack    : singleTargetAttack,
  takeDamage            : takeDamage,
  updateActiveGroups    : updateActiveGroups,
  victory               : victory,
  wipeout               : wipeout
};

// bypass circular dependency issues with dependency injection
var AI = require(__dirname + '/ai_helpers')(battleHelpers);

// takes results from an attack and returns a message detailing the attack
function applyAttackResults (results, DQC, scenario, member, target, verbose) {
  var message = '';
  verbose = !!verbose;

  if (isTargetable(target)) {
    if (results.is_crit) {
      message += member.is_enemy ? ' A terrible blow!' : ' Excellent move!';
    }
    if (results.is_miss) {
      message += verbose ? ' Attack missed!' : ' Missed!';
    } else if (results.is_dodge) {
      if (verbose) {
        message += ' ' + target.displayName() + ' ' + ((target.flavor && target.flavor.dodge) || 'smoothly dodges the attack') + '!';
      } else {
        message += ' Dodged!';
      }
    } else if (_.includes(target.status, 'IR')) {
      message += ' no effect.';
    } else if (!results.damage) {
      message += verbose ? ' Attack failed!' : ' Failed!';
    } else {
      message += ' Lost ' + results.damage + ' HP.';

      // apply damage to target
      takeDamage(scenario, target, results.damage);
      if (target.is_dead) {
        message += defeated(DQC, target, member);
        
      } else if (results.onHits) {
        // apply on-hit effects
        message += ' ' + applyOnHitEffects(DQC, scenario, member, target);
      }
    }
  }

  return message.trim();
}

// attempts to apply on-hit status or spell effect(s) to the target
function applyOnHitEffects (DQC, scenario, member, target) {
  var Skill    = require(__dirname + '/skills');
  var Spell    = require(__dirname + '/spells');
  var statuses = nconf.get('status');
  var messages = [];
  var ability;
  var weapon;
  var heart;

  function applyOnHit (on_hit) {
    var resist  = target.resist[on_hit.resist] || 0;
    var saver   = getSaver(on_hit.resist);
    var message = '';

    if (!DQC.RNG.bool(resist, 16)) {
      message = on_hit.message || '';
      if (saver && target.saver[saver] && DQC.RNG.bool(1, 4)) {
        // saved!
        message += ' ' + 'SAVED!';

      } else {
        // apply the effect to the target
        if (_.includes(statuses, on_hit.effect) && !_.includes(target.status, on_hit.effect)) {
          message += ' ' + applyStatus(on_hit.effect, target);
          if (target.is_dead) {
            defeated(DQC, target, member);
          }

        } else if (/^SKILL/.test(on_hit.effect)) {
          ability = on_hit.effect.replace('SKILL:', '');
          var skill = new Skill(ability, DQC.data);
          if (skill.is_set && !DQC.RNG.bool(skill.miss, 32)) {
            message += ' ' + skill.useSkill(DQC, scenario, member, [target]);
          }

        } else if (/^SPELL/.test(on_hit.effect)) {
          ability = on_hit.effect.replace('SPELL:', '');
          var spell = new Spell(ability, DQC.data);
          if (spell.is_set && !DQC.RNG.bool(spell.miss, 32)) {
            message += ' ' + spell.castSpell(DQC, scenario, member, [target]);
          }
        }
      }

      messages.push(message.trim());
    }
  }

  if (member.on_hit && member.on_hit.chance) {
    if (DQC.RNG.bool(member.on_hit.chance, 32)) {
      applyOnHit(member.on_hit);
    }
  }

  if (member.equip && member.equip.weapon) {
    weapon = _.find(DQC.data.weapon, { name : member.equip.weapon });
    if (weapon && weapon.on_hit.chance && DQC.RNG.bool(weapon.on_hit.chance, 32)) {
      applyOnHit(weapon.on_hit);
    }
  }

  if (member.heart && member.heart.name) {
    heart = _.find(DQC.data.heart, { name : member.heart.name });
    if (heart && heart.on_hit.chance && DQC.RNG.bool(heart.on_hit.chance, 32)) {
      applyOnHit(heart.on_hit);
    }
  }

  return messages.join(' ');
}

// applies a status effect and returns a status message
function applyStatus (status, member) {
  var statuses = nconf.get('status');
  var message;

  if (_.includes(statuses, status)) {
    member.status = _.union(member.status, [status]);
    switch (status) {
      case 'BA':
        message = 'Cloaked in a veil of lights!';
        break;
      case 'BK':
        message = 'Attack Power increases!';
        break;
      case 'BO':
        message = 'A shining wall of light appears!';
        break;
      case 'CF':
        message = 'Confused!';
        break;
      case 'DE':
        message = 'Killed outright!';
        member.status = ['DE'];
        member.effects = [];
        member.is_dead = true;
        member.curr_HP = 0;
        break;
      case 'DR':
        message = 'Transforms into a rampaging dragon!';
        break;
      case 'FR':
        message = 'Frozen in fear!';
        break;
      case 'IR':
        message = 'Becomes a lump of iron!';
        break;
      case 'NU':
        message = 'Paralyzed!';
        break;
      case 'PO':
        message = 'Poisoned!';
        break;
      case 'SL':
        message = 'Asleep!';
        break;
      case 'ST':
        message = 'Magic sealed!';
        break;
      case 'SU':
        message = 'Engulfed in images!';
        break;
    }
  }

  return message;
}

// determine next symbol that can be assigned among group(s) of monsters
// returns no symbol ('') if no monsters found
function calculateNextSymbol (scenario, group_type, name) {
  var groups = _.findValue(scenario, 'battle.' + group_type + '.groups');
  var found  = false;
  var code   = 65;  // symbols start at 'A'

  _.each(groups, function (group) {
    var first = group.members[0] || {};
    if (first.name === name) {
      found = true;
      _.each(group.members, function (member) {
        if (member.symbol && member.symbol.charCodeAt() > code) {
          code = member.symbol.charCodeAt();
          symbol = member.symbol;
        }
      });
    }
  });

  if (!found) {
    return '';
  } else {
    return String.fromCharCode(code + 1);
  }
}

// check that current HP is in bounds and set flags if dead
function checkHP (member) {
  // curr_HP cannot be greater than max_HP or less than 0
  member.curr_HP = Math.min(member.curr_HP, member.max_HP);
  member.curr_HP = Math.max(member.curr_HP, 0);

  if (member.curr_HP === 0) {
    member.is_dead = true;
    member.status  = ['DE'];
    member.effects = [];
  } else {
    member.is_dead = false;
    member.status  = _.difference(member.status, ['DE']);
  }
}

// check that current MP is in bounds
function checkMP (member) {
  // curr_MP cannot be greater than max_HP or less than 0
  member.curr_MP = Math.min(member.curr_MP, member.max_MP);
  member.curr_MP = Math.max(member.curr_MP, 0);
}

// check for automatic recovery from various status ailments
// each check is independant of the others.
function checkStatusRecovery (DQC, scenario, member) {
  var message   = member.displayName();
  var separator = '';

  if (_.includes(member.status, 'IR')) {
    // IRONIZE lasts until the end of the turn
    message += ' is a lump of iron.';
  }

  if (_.includes(member.status, 'FR')) {
    // FEAR only lasts a single turn
    member.status = _.difference(member.status, ['FR']);
    message += ' is frozen in fear!';
    separator = ' And';
  }

  if (_.includes(member.status, 'SL')) {
    // SLEEP has a 1/2 chance of being cured
    if (DQC.RNG.bool(1, 2)) {
      member.status = _.difference(member.status, ['SL']);
      message += separator + ' wakes up!';
    } else {
      message += separator + ' is asleep.';
    }
    separator = ' And';
  }

  if (_.includes(member.status, 'NU')) {
    // NUMB has a 1/8 chance of being cured
    if (DQC.RNG.bool(1, 8)) {
      member.status = _.difference(member.status, ['NU']);
      message += separator + ' is cured of paralysis!';
    } else {
      message += separator + ' is paralyzed.';
    }
  }

  return message;
}

// For a given enemy, select a single target from the opposing side.
// This target will be used for a flee check, and for default physical attacks.
function chooseEnemyTarget (DQC, scenario, enemy, front) {
  var group_options     = [];
  var member_options    = [];
  var targetable_groups = [];
  var selected_group;
  var target_type;
  var target;

  // filter targetable groups based on front
  var has_characters = false;
  var has_allies     = false;
  if (scenario.battle.has_fronts && front && front !== 'ALL') {
    targetable_groups = _.map(scenario.battle.characters.groups, function (group) {
      if (group.active && (group.front === front || group.front === 'ALL')) {
        has_characters = true;
        return { type : 'characters', front : group.front, members : group.members };
      }
    }).concat(_.map(scenario.battle.allies.groups, function (group) {
      if (group.active && (group.front === front || group.front === 'ALL')) {
        has_allies = true;
        return { type : 'allies', front : group.front, members : group.members };
      }
    }));
    targetable_groups = _.compact(targetable_groups);
  } else {
    targetable_groups = _.map(scenario.battle.characters.groups, function (group) {
      if (group.active) {
        has_characters = true;
        return { type : 'characters', front : group.front, members : group.members };
      }
    }).concat(_.map(scenario.battle.allies.groups, function (group) {
      if (group.active) {
        has_allies = true;
        return { type : 'allies', front : group.front, members : group.members };
      }
    }));
    targetable_groups = _.compact(targetable_groups);
  }

  if (!targetable_groups.length) {
    throw new Error('No targetable groups found for enemy ' + enemy.displayName() + ' in scenario ' + scenario.name);
  }

  // if both characters and allies are present, ally units only have a 25% chance of being targeted
  if (has_characters && has_allies) {
    if (DQC.RNG.bool(1, 4)) {
      targetable_groups = _.filter(targetable_groups, { type : 'allies' });
    } else {
      targetable_groups = _.filter(targetable_groups, { type : 'characters' });
    }
  }

  // select the group to target (equal chance between each active group)
  selected_group = targetable_groups[DQC.RNG.integer(0, targetable_groups.length - 1)];

  // select the member in the group to target (weighted by formation)
  _.each(selected_group.members, function (member, index) {
    if (isTargetable(member)) {
      member_options.push(index);
    }
  });

  if (member_options.length) {
    target = DQC.RNG.integer(1, 16);
    switch (member_options.length) {
      case 1:
        target = member_options[0];
        break;
      case 2:
        target = (target <= 10) ? member_options[0] : member_options[1];
        break;
      case 3:
        target = (target <= 8) ? member_options[0]
               : (target <= 13) ? member_options[1] : member_options[2];
        break;
      case 4:
        target = (target <= 7) ? member_options[0]
               : (target <= 11) ? member_options[1]
               : (target <= 14) ? member_options[2] : member_options[3];
        break;
      default:
        throw new Error('Invalid party size of ' + member_options.length + ' for scenario ' + scenario.name);
        break;
    }
    target = selected_group.members[target];
  } else {
    throw new Error('No targetable members found for ' + enemy.displayName() + ' in scenario ' + scenario.name);
  }

  return target;
}

// remove all battle-only statuses and spell/skill effects; reset stats
function clearBattleEffects (member) {
  member.status  = _.difference(member.status, ['BA', 'BO', 'CF', 'DR', 'FR', 'IR', 'SL', 'ST', 'SU']);
  member.effects = [];

  member.curr_strength = member.adj_strength;
  member.curr_agility  = member.adj_agility;
  member.curr_attack   = member.attack;
  member.curr_defense  = member.defense;
}

// creates a new battle group containing the members passed in
function createNewGroup (members) {
  members = _.isArray(members) ? members : _.isObject(members) ? [members] : [];

  var new_group = {
    members : members,
    active  : isActive(members),
    front   : null
  };

  return new_group;
}

// cures a status effect and returns a status message
function cureStatus (status, member) {
  var statuses = nconf.get('status');
  var message;

  if (_.includes(statuses, status)) {
    if (!_.includes(member.status, status) && !_.includes(['ALL', 'NEG', 'POS'], status)) {
      message = 'no effect.';
    } else {
      member.status = _.difference(member.status, [status]);
      switch (status) {
        case 'ALL':
          member.status = member.is_dead ? ['DE'] : [];
          message = 'status reset.';
          break;
        case 'BA':
          message = 'the barrier fades!';
          break;
        case 'BK':
          message = 'power returns to normal!';
          break;
        case 'BO':
          message = 'the reflection shatters!';
          break;
        case 'CF':
          message = 'snaps out of confusion!';
          break;
        case 'DE':
          message = 'revived!';
          member.is_dead = false;
          delete member.can_cast;
          delete member.defeated_by;
          member.curr_HP = 1;
          break;
        case 'DR':
          message = 'no longer a dragon!';
          break;
        case 'FR':
          message = 'fear subsides!';
          break;
        case 'IR':
          message = 'develops an iron deficiency!';
          break;
        case 'NEG':
          member.status = _.difference(member.status, ['CF', 'FR', 'NU', 'PO', 'SL', 'ST', 'SU']);
          message = 'status restored!';
          break;
        case 'NU':
          message = 'cured of paralysis!';
          break;
        case 'POS':
          member.status = _.difference(member.status, ['BA' , 'BK', 'BO', 'DR', 'IR']);
          message = 'status cleared!';
          break;
        case 'PO':
          message = 'cured of poison!';
          break;
        case 'SL':
          message = 'wakes up!';
          break;
        case 'ST':
          message = 'the seal is broken!';
          delete member.can_cast;
          break;
        case 'SU':
          message = 'the illusion clears!';
          break;
      }
    }
  }

  return message;
}

// sets data and returns a message indicating that a member has fallen in battle
function defeated (DQC, member, attacker, hide_message) {
  var message = (member.type === 'character') ? helpers.format(' Thou art dead.', true) : (hide_message ? '' : ' - Defeated!');

  if (member.type === 'character') {
    member.deaths++;
  }

  if (attacker && attacker.type === 'character') {
    member.defeated_by = attacker.displayName();

    // check for monster recruitment
    if (member.is_enemy && member.type === 'monster') {
      if (formulas.canRecruit(attacker, member) && formulas.recruitment(DQC, attacker, member)) {
        // for a successful monster recruitment, always overwrite any previous recruits
        attacker.recruit = member.name;
      }
    }
  }


  return message;
}

// conduct all necessary end of battle cleanup
function endOfBattle (DQC, scenario) {
  scenario.in_battle = false;
  if (scenario.battles_remaining) {
    scenario.battles_remaining--;
  }
  scenario.battle.turn = 0;
  scenario.battle.has_fronts = false;
  scenario.battle.enemies = {};
}

// conduct all necessary end of turn battle cleanup
function endOfTurn (DQC, scenario) {
  var isIronize = false;

  function turnCleanup (group) {
    _.each(group.members, function (member) {
      if (_.includes(member.status, 'IR')) {
        member.status = _.difference(member.status, ['IR']);
        isIronize = true;
      }

      member.command = undefined;
    });
  }

  delete scenario.battle.turn_order;

  _.each(scenario.battle.characters.groups, turnCleanup);
  _.each(scenario.battle.allies.groups, turnCleanup);
  _.each(scenario.battle.enemies.groups, turnCleanup);

  if (isIronize) {
    DQC.out('The effects of Ironize wear off.');
  }

  scenario.battle.turn++;
}

// remove the selected member from the battle scenario
function expelFromBattle (scenario, member) {
  var group_type = groupType(member);
  _.each(scenario.battle[group_type].groups, function (group, group_index) {
    var index = _.findIndex(group.members, member);
    if (index > -1) {
      group.members.splice(index, 1);
      member.in_battle = false;
      member.group_index = null;
      member.front = null;
      clearBattleEffects(member);

      // remove the group from battle if it does not have any members
      if (!group.members.length) {
        scenario.battle[group_type].groups.splice(group_index, 1);
      }

      // remove from turn order in battle
      _.remove(scenario.battle.turn_order, member);

      // break out of the loop early
      return false;
    }
  });

  updateActiveGroups(scenario, group_type);
}

// loop over all members and return the one with the highest stat
function findByHighestStat (scenario, group_type, stat_name) {
  var match = {};
  match[stat_name] = -1;

  if (group_type && scenario.battle[group_type]) {
    _.each(scenario.battle[group_type].groups, function (group) {
      if (group.active) {
        _.each(group.members, function (member) {
          if (isTargetable(member)) {
            if (member[stat_name] > match[stat_name]) {
              match = member;
            }
          }
        });
      }
    });
  } else {
    match = undefined;
  }

  return match;
}

// loop over all members of a battle and return the first match found
function findMember (scenario, searchMember, group_type) {
  var found = false;
  var index, match;

  function groupFind (group) {
    index = _.findIndex(group.members, function (member) {
      var dispName = member.displayName();

      if (_.isObject(searchMember)) {
        return (member === searchMember);
      } else if (_.isString(searchMember)) {
        return (dispName === searchMember);
      }
    });

    // break out of loop if found
    if (index > -1) {
      match = group.members[index];
      found = true;
      return false;
    }
  }

  if (group_type && scenario.battle[group_type]) {
    // loop only over the specified group
    _.each(scenario.battle[group_type].groups, groupFind);

  } else {
    // loop over all groups in a battle
    _.each(scenario.battle.characters.groups, groupFind);
    if (!found) {
      _.each(scenario.battle.allies.groups, groupFind);
    }
    if (!found) {
      _.each(scenario.battle.enemies.groups, groupFind);
    }
  }

  return match;
}

// loop through all participants in battle and generate a random turn order
function generateTurnOrder (DQC, scenario) {
  var turn_order = [];

  // loop over enemies first so that ties will go to allies/characters instead.
  _.each(scenario.battle.enemies.groups, rollForInitiative);
  _.each(scenario.battle.allies.groups, rollForInitiative);
  _.each(scenario.battle.characters.groups, rollForInitiative);
  turn_order = _.sortBy(turn_order, 'order').reverse();

  scenario.battle.turn_order = turn_order;

  // calculates agility scores based on the curr_agility of each member in the group
  function rollForInitiative (group) {
    var agi_score;

    _.each(group.members, function (member) {
      // there must be a will to fight!
      if (!member.is_dead && member.can_act) {
        if (member.curr_agility === 0) {
          agi_score = DQC.RNG.integer(0, 1);
        } else {
          agi_score = formulas.turnOrder(member.curr_agility, DQC.RNG);
        }

        member.order = parseInt(agi_score, 10);
        turn_order.push(member);
      }
    });
  }
}

// get ALL groups of a particular group type, optionally filtered by front or active status
function getAllGroups (scenario, group_type, front, filter_active) {
  var target_groups = _.findValue(scenario, 'battle.' + group_type + '.groups', []);
  var groups        = [];

  if (target_groups.length) {
    _.each(target_groups, function (group) {
      if (scenario.battle.has_fronts && isSameFront(front, group.front)) {
        groups.push(group);
      } else if (!scenario.battle.has_fronts) {
        groups.push(group);
      }
    });
  }

  if (filter_active) {
    groups = _.filter(groups, { active : true });
  }

  return groups;
}

// get ALL members of a particular group type, optionally filtered by front or a group index
// this function does not distinguish between dead, untargetable, inactive, etc. members
function getAllMembers (scenario, group_type, group_index, front) {
  var target_groups = _.findValue(scenario, 'battle.' + group_type + '.groups', []);
  var members       = [];

  if (target_groups.length) {
    // battle with fronts, only return members from a specific front
    if (scenario.battle.has_fronts && front && front !== 'ALL') {
      _.each(target_groups, function (group, index) {
        if (isSameFront(front, group.front)) {
          if (typeof group_index === 'number') {
            if (group_index === index) {
              // only return members if front and group index matches up
              _.each(group.members, function (member) { members.push(member); });
            }
          } else {
            // return members from all groups with a matching front
            _.each(group.members, function (member) { members.push(member); });
          }
        }
      });
    } else {
      _.each(target_groups, function (group, index) {
        if (typeof group_index === 'number') {
          if (group_index === index) {
            // only return members from a specific group index
            _.each(group.members, function (member) { members.push(member); });
          }
        } else {
            // return all members from all groups
          _.each(group.members, function (member) { members.push(member); });
        }
      });
    }
  }

  return members;
}

// returns the multiplier used for XP/gold rewards after battle
function getMultiplier (scenario) {
  var party_size = 0;
  var multiplier;

  _.each(scenario.characters, function (character) {
    if (character.in_battle && !character.is_dead) {
      party_size++;
    }
  });

  multiplier = formulas.multiplier(party_size);

  return multiplier;
}

// get the SAVER value for the corresponding resist type
function getSaver (resist) {
  var burn = ['burn'];
  var phys = ['beat', 'numb', 'poison', 'sap', 'slow'];
  var ment = ['chaos', 'robmagic', 'sleep', 'stopspell', 'surround'];

  if (_.includes(burn, resist)) {
    return 'burn';
  } else if (_.includes(ment, resist)) {
    return 'ment';
  } else if (_.includes(phys, resist)) {
    return 'phys';
  } else {
    return undefined;
  }
}

// determine which group type (characters, allies, enemies) a member belongs to
function groupType (member) {
  if (member.is_enemy) {
    return 'enemies';
  } else if (member.type === 'character') {
    return 'characters';
  } else {
    return 'allies';
  }
}

// heals the amount of damage passed in
function healDamage (scenario, member, amount) {
  if (!member.is_dead) {
    member.curr_HP += amount;
    checkHP(member);
  }
}

// check whether a group has alive, targetable members
function isActive (members) {
  return !!_.findWhere(members, { is_dead : false, can_target : true });
}

// check if a member is parrying and eligible to receive damage reduction
function isDefending (member) {
  return !!(member.parry && !isIncapacitated(member));
}

// check if a member is able to take a turn in battle
// cannot act if dead, fear, iron, numb, or sleep
function isIncapacitated (member) {
  return !!_.intersection(member.status, ['DE', 'FR', 'IR', 'NU', 'SL']).length;
}

// check if all players have been defeated
function isPlayerWipeout (scenario) {
  return !_.findWhere(scenario.characters, { is_dead : false });
}

// check if a group type has active members remaining
function isRemaining (scenario, group_type) {
  return !!_.findWhere(scenario.battle[group_type].groups, { active : true });
}

// check if two fronts are directly assailable
function isSameFront (member_front, target_front) {
  return (member_front === target_front || member_front === 'ALL' || target_front === 'ALL');
}

// check if a member is alive, in battle, and targetable
function isTargetable (member) {
  return (member.in_battle && member.can_target && !member.is_dead);
}

// set stats and flags accordingly for a member joining a battle
function joinBattle (DQC, scenario, member, is_enemy, type) {
  member.in_battle  = true;
  member.is_enemy   = !!is_enemy;
  member.type       = type || member.type;
  member.can_act    = (member.can_act !== false);
  member.can_target = (member.can_target !== false);

  if (member.type === 'monster' && is_enemy) {
    // set HP between 75% and 100% of max
    member.curr_HP = formulas.monsterHP(member.max_HP, DQC.RNG);
    checkHP(member);
  }

  if (typeof member.curr_HP === 'undefined') {
    member.curr_HP = member.max_HP;
    checkHP(member);
  }
  if (typeof member.curr_MP === 'undefined') {
    member.curr_MP = member.max_MP;
    checkMP(member);
  }

  return member;
}

// perform a command for a member in battle
function performCommand (DQC, scenario, command) {
  // bypass circular dependency issue with dependency injection
  var Commands = require(__dirname + '/commands')(battleHelpers);
  var member   = command.member;
  var type     = (member.command.type || '').toLowerCase();
  var message;

  if (typeof Commands[type] === 'function') {
    message = Commands[type](DQC, scenario, command);
  } else {
    throw new Error('Could not perform command ' + type + ' for ' + member.name);
  }

  return message;
}

// apply poison damage for this member (1/16 max_HP)
// return the damage total for display purposes
function poison (scenario, member) {
  var amount = parseInt(member.max_HP / 16, 10) || 1;
  takeDamage(scenario, member, amount);
  return amount;
}

// apply HP regeneration for this member (1/16 max_HP)
// return the recovery total for display purposes
function regenHP (scenario, member) {
  var amount = parseInt(member.max_HP / 16, 10) || 1;
  healDamage(scenario, member, amount);
  return amount;
}

// reset battle formation by adding characters and allies back into the battle
// this is a blind reset that has no memory of previous formations
function resetFormation (DQC, scenario) {
  var group_index = 0;

  _.each(scenario.characters, function (character, index) {
    if (!character.in_battle) {
      addToBattle('characters', index);
    }
  });

  group_index = 0;
  _.each(scenario.allies, function (ally, index) {
    if (!ally.in_battle) {
      addToBattle('allies', index);
    }
  });

  function addToBattle(group_type, index) {
    var member = scenario[group_type][index];
    var length = scenario.battle[group_type].groups.length;
    var added  = false;
    var group;
    
    // check if group has room for another member
    while (!added && group_index < length) {
      group = scenario.battle[group_type].groups[group_index];
      if (group.members && group.members.length < 4) {
        group.members.push(member);
        group.active = isActive(group.members);
        added = true;
      } else {
        group_index++;
      }
    }

    // all current groups are full, create a new group
    if (!added) {
      scenario.battle[group_type].groups.push(createNewGroup([member]));
    }
  }
}

// retarget an attack to the weakest member remaining in the group
function retarget (scenario, target) {
  if (!target.is_dead) {
    return target;
  }

  var group_type = groupType(target);
  var retarget   = AI.findWeakestRemaining(scenario, group_type, target.group_index, target.front, true);
  // default to the original target
  retarget = retarget || target;

  return retarget;
}

// separate all battle groups into an array of fronts
function separateIntoFronts (scenario) {
  var fronts = [];

  function addToFront (group, type) {
    var index = _.findIndex(fronts, { front : group.front });
    var newFront;

    if (index !== -1) {
      fronts[index][type].push(group);
    } else {
      newFront = {
        front      : group.front,
        characters : [],
        allies     : [],
        enemies    : []
      };
      newFront[type].push(group);
      fronts.push(newFront);
    }
  }

  _.each(scenario.battle.characters.groups, function (group) { addToFront(group, 'characters'); });
  _.each(scenario.battle.allies.groups, function (group) { addToFront(group, 'allies'); });
  _.each(scenario.battle.enemies.groups, function (group) { addToFront(group, 'enemies'); });

  return fronts;
}

// simulate a single character's turn in battle
function simulateCharacterTurn (DQC, scenario, character) {
  var dispName = character.displayName();
  var hits     = Math.max(character.hits, 1);
  var hasTurn  = true;
  var message  = '';

  // See if a character can recover from its incapacitated state
  if (isIncapacitated(character)) {
    message = checkStatusRecovery(DQC, scenario, character);
    hasTurn = false;
  }

  if (character.is_cursed && DQC.RNG.bool(1, 4)) {
    message = dispName + ' is held by the curse!';
    hasTurn = false;
  }

  if (hasTurn && _.includes(character.status, 'CF')) {
    switch (DQC.RNG.integer(1, 4)) {
      case 1:
        character.status = _.difference(character.status, ['CF']);
        message += dispName + ' snaps out of confusion!';
        hasTurn = false;
        break;
      case 2:
        // physical attack
        character.command = {
          type   : 'ATTACK',
          member : character,
          target : AI.confusionTargeting(DQC, scenario, character)
        };
        break;
      case 3:
        // random spell
        delete character.command;

        if (_.includes(character.status, 'DR')) {
          AI.setCommandBeDragon(DQC, scenario, character);
          character.command.target = AI.confusionTargeting(DQC, scenario, character);
        } else {
          AI.setCommandRandomSpell(DQC, scenario, character);
          if (!character.command) {
            message += helpers.format('"' + helpers.randomString(DQC.RNG) + '!"', false, true) + ' ' + dispName + ' is attempting to cast a spell!';
            hasTurn = false;
          }
        }
        break;
      case 4:
      default:
        message += dispName + ' is flustered!';
        hasTurn = false;
        break;
    }
  } else if (hasTurn && _.includes(character.status, 'DR')) {
      AI.setCommandBeDragon(DQC, scenario, character);
  }

  if (hasTurn) {
    if (character.command) {
      hits = (character.command.type === 'ATTACK') ? hits : 1;
      while (hits > 0) {
        // perform the command
        message += performCommand(DQC, scenario, character.command);
        hits--;
        message += hits ? "\n" : "";
      }

    } else {
      character.command = {
        type   : 'NONE',
        member : character
      };
      message += performCommand(DQC, scenario, character.command);
    }
  }

  if (character.in_battle) {
    if (!character.is_dead && _.includes(character.status, 'PO')) {
      amount = poison(scenario, character);
      message += ' Poison! Lost ' + amount + ' HP!';
      if (character.is_dead) {
        message += defeated(DQC, character);
      }
    }

    if (!character.is_dead && character.regen) {
      amount = regenHP(scenario, character);
      message += ' Regen! Gained ' + amount + ' HP!';
    }
  }

  return message;
}

// simulate a single monster's turn in battle
function simulateMonsterTurn (DQC, scenario, monster) {
  var dispName   = monster.displayName();
  var fleeTarget = (monster.command && monster.command.target);
  var hits       = Math.max(monster.hits || 1);
  var hasTurn    = true;
  var message    = '';
  var index, amount;

  // See if a monster can recover from its incapacitated state
  if (isIncapacitated(monster)) {
    message += checkStatusRecovery(DQC, scenario, monster);
    hasTurn = false;
  }

  // Perform a flee check for enemy monsters.
  if (hasTurn && monster.is_enemy) {
    fleeTarget = !_.isEmpty(fleeTarget) ? fleeTarget : chooseEnemyTarget(DQC, scenario, monster, monster.front);
    // if target STR >= monster attack * 2, the monster will flee at a 25% rate
    if ((monster.attack * 2) <= fleeTarget.adj_strength) {
      if (DQC.RNG.bool(1, 4)) {
        message = dispName + ' is running away.';
        expelFromBattle(scenario, monster);
        return message;
      }
    }
  }

  if (hasTurn && _.includes(monster.status, 'CF')) {
    switch (DQC.RNG.integer(1, 4)) {
      case 1:
        monster.status = _.difference(monster.status, ['CF']);
        message += dispName + ' snaps out of confusion!';
        hasTurn = false;
        break;
      case 2:
        // physical attack
        monster.command = {
          type   : 'ATTACK',
          member : monster,
          target : AI.confusionTargeting(DQC, scenario, monster)
        }
        break;
      case 3:
        // random action
        delete monster.command;

        if (_.includes(monster.status, 'DR')) {
          AI.setCommandBeDragon(DQC, scenario, monster);
          monster.command.target = AI.confusionTargeting(DQC, scenario, monster);
        } else {
          AI.chooseCommand(DQC, scenario, monster);
        }
        break;
      case 4:
      default:
        message += dispName + ' ' + (monster.flavor.confusion || 'is flustered!');
        hasTurn = false;
        break;
    }
  } else if (hasTurn && _.includes(monster.status, 'DR')) {
    AI.setCommandBeDragon(DQC, scenario, monster);
  }

  if (hasTurn) {
    while (hits > 0) {
      if (!monster.command) {
        // choose the command for this monster
        AI.chooseCommand(DQC, scenario, monster);
      }

      // perform the command
      message += performCommand(DQC, scenario, monster.command);
      
      delete monster.command;
      hits--;
      message += hits ? "\n" : "";
    }
  }

  if (monster.in_battle) {
    if (!monster.is_dead && _.includes(monster.status, 'PO')) {
      amount = poison(scenario, monster);
      message += ' Poison! Lost ' + amount + ' HP!';
      if (monster.is_dead) {
        message += defeated(DQC, monster);
      }
    }

    if (!monster.is_dead && monster.regen) {
      amount = regenHP(scenario, monster);
      message += ' Regen! Gained ' + amount + ' HP!';
    }
  }

  return message;
}

// simulate a single NPC's turn in battle
function simulateNPCTurn (DQC, scenario, npc) {
  var dispName = npc.displayName();
  var hits     = Math.max(npc.hits, 1);
  var hasTurn  = true;
  var message  = '';

  // See if an NPC can recover from its incapacitated state
  if (isIncapacitated(npc)) {
    message += checkStatusRecovery(DQC, scenario, npc);
    hasTurn = false;
  }

  if (npc.is_cursed && DQC.RNG.bool(1, 4)) {
    message = dispName + ' is held by the curse!';
    hasTurn = false;
  }

  if (hasTurn && _.includes(npc.status, 'CF')) {
    switch (DQC.RNG.integer(1, 4)) {
      case 1:
        npc.status = _.difference(npc.status, ['CF']);
        message += dispName + ' snaps out of confusion!';
        hasTurn = false;
        break;
      case 2:
        // physical attack
        npc.command = {
          type   : 'ATTACK',
          member : npc,
          target : AI.confusionTargeting(DQC, scenario, npc)
        }
        break;
      case 3:
        // random action
        delete npc.command;

        if (_.includes(npc.status, 'DR')) {
          AI.setCommandBeDragon(DQC, scenario, npc);
          npc.command.target = AI.confusionTargeting(DQC, scenario, npc);
        } else {
          AI.chooseCommand(DQC, scenario, npc);
        }
        break;
      case 4:
      default:
        message += dispName + ' is flustered!';
        hasTurn = false;
        break;
    }
  } else if (hasTurn && _.includes(npc.status, 'DR')) {
    AI.setCommandBeDragon(DQC, scenario, npc);
  }

  if (hasTurn) {
    if (!npc.command) {
      // choose the command for this NPC
      AI.chooseCommand(DQC, scenario, npc);
    }

    hits = (npc.command.type === 'ATTACK') ? hits : 1;
    while (hits > 0) {
      // perform the command
      message += performCommand(DQC, scenario, npc.command);
      hits--;
      message += hits ? "\n" : "";
    }
  }

  if (npc.in_battle) {
    if (!npc.is_dead && _.includes(npc.status, 'PO')) {
      amount = poison(scenario, npc);
      message += ' Poison! Lost ' + amount + ' HP!';
      if (npc.is_dead) {
        message += defeated(DQC, npc);
      }
    }

    if (!npc.is_dead && npc.regen) {
      amount = regenHP(scenario, npc);
      message += ' Regen! Gained ' + amount + ' HP!';
    }
  }

  return message;
}

// simulates a single target attack and returns the results
function singleTargetAttack (DQC, member, target) {
  var curr_miss  = member.adj_miss + (_.includes(member.status, 'SU') ? 20 : 0);
  var ATK        = member.curr_attack;
  var DEF        = target.curr_defense;
  var results    = {
    is_miss   : DQC.RNG.bool(curr_miss, 32),
    is_crit   : DQC.RNG.bool(member.adj_critical, 32),
    is_dodge  : !isIncapacitated(target) && DQC.RNG.bool(target.adj_dodge, 256),
    is_on_hit : member.on_hit && DQC.RNG.bool(member.on_hit.chance, 32),
    is_plink  : null,
    success   : null,
    damage    : 0,
    onHits    : true
  };

  // Special Case: Charge Up doubles attack power for a single strike
  if (_.includes(member.effects, 'Charge Up')) {
    ATK = ATK * 2;
    member.effects = _.difference(member.effects, ['Charge Up']);
  }
  // Special Case: Wayfinder never misses its mark
  if (_.findValue(member, 'equip.weapon') === 'Wayfinder') {
    results.is_miss = results.is_dodge = false;
  }

  if (!results.is_miss && !results.is_dodge) {
    if (results.is_crit) {
      // damage according to critical hit formula
      results.damage  = formulas.criticalDamage(ATK, DQC.RNG);
    } else {
      results.is_plink = formulas.plink(ATK, DEF, member.is_enemy);
      if (results.is_plink) {
        // damage according to plink formula
        results.damage = formulas.plinkDamage(ATK, DEF, member.is_enemy, DQC.RNG);
      } else {
        // damage according to standard physical attack formula
        results.damage = formulas.physicalDamage(ATK, DEF, DQC.RNG);
      }
    }
    if (_.includes(member.status, 'BK') && !results.is_crit) {
      results.damage *= 2;
    }
    if (isDefending(target)) {
      results.damage = parseInt(results.damage / 2, 10);
    }

    // Special Case: Poison Needle always does 1 damage
    if (_.findValue(member, 'equip.weapon') === 'Poison Needle') {
      results.damage = 1;
    }
  }

  // successful attacks strike the target for at least 1 damage
  results.success = (!results.is_miss && !results.is_dodge && results.damage > 0);

  return results;
}

// inflicts the amount of damage passed in
function takeDamage (scenario, member, amount) {
  if (!member.is_dead) {
    member.curr_HP -= amount;
    checkHP(member);
    if (member.is_dead) {
      updateActiveGroups(scenario, groupType(member));
    }
  }
}

// updates the active flags for each group
// also recalculates the front and group_index for each member
function updateActiveGroups (scenario, group_type) {
  _.each(scenario.battle[group_type].groups, function (group, group_index) {
    group.active = isActive(group.members);
    _.each(group.members, function (member) {
      member.front       = group.front;
      member.group_index = group_index;
    });
  });
}

// update scenario after a battle victory
function victory (DQC, scenario) {
  var multiplier = getMultiplier(scenario);
  var xpTotal    = 0;
  var goldTotal  = 0;
  var treasures  = [];
  var recruits   = [];

  function addItem (character, item) {
    var ticket;
    // lottery tickets have their own inventory space, and must be generated randomly
    if (item === 'Loto 3 Ticket') {
      ticket = lottery.randloto(DQC.RNG);
      character.loto3.push(ticket);
      treasures.push(ticket);

    } else if (item === 'Ball of Light Ticket') {
      ticket = lottery.randbol(DQC.RNG);
      character.bol.push(ticket);
      treasures.push(ticket);

    } else {
      if (character.inventory.length < nconf.get('inventory_limit')) {
        character.inventory.push(item);
      } else if (character.has_bag && character.bag.length < nconf.get('bag_limit')) {
        character.bag.push(item);
      } else {
        treasures.push('Thine inventory is full. Please specify one of the following items to use, transfer, or drop: ');
        treasures.push([].concat(character.inventory, character.bag).join(', '));
      }
    }
  }

  function addRecruit (character, species) {
    var roster   = _.filter(DQC.data.recruit, { owner : character.name });
    var monster  = _.find(DQC.data.monster, { name : species }) || {};
    var new_name = 'new_' + species + '_' + character.name;

    if (roster.length < 8) {
      DQC.data.recruit.push({ name : new_name, species : species, owner : character.name, status : [], curr_HP : monster.max_HP, curr_MP : monster.max_MP });
    } else {
      roster = _.map(roster, function (recruit) {
        return (recruit.name + ' (' + recruit.species + ')');
      });
      recruits.push('Thou already command a full roster of monsters. Please specify one of the following to dismiss: ');
      recruits.push(roster.join(', '));
    }
  }

  _.each(scenario.battle.enemies.groups, function (group) {
    _.each(group.members, function (enemy) {
      xpTotal += enemy.experience;
      goldTotal += enemy.gold;

      var drop      = enemy.drop;
      var character = enemy.defeated_by && _.findWhere(scenario.characters, { name : enemy.defeated_by });
      if (character && character.in_battle && !character.is_dead) {
        // Check for treasures (priority: common > rare > heart)
        if (drop.common.name && DQC.RNG.bool(drop.common.rate, 256)) {
          treasures.push('Fortune smiles upon thee, ' + enemy.defeated_by + ', for thou hast obtained the ' + drop.common.name + '.');
          addItem(character, drop.common.name);
          treasures.push('');

        } else if (drop.rare.name && DQC.RNG.bool(drop.rare.rate, 256)) {
          treasures.push('Fortune smiles upon thee, ' + enemy.defeated_by + ', for thou hast obtained the ' + drop.rare.name + '.');
          addItem(character, drop.rare.name);
          treasures.push('');

        } else if (drop.heart.name && DQC.RNG.bool(drop.heart.rate, 1024)) {
          var heartDesc = _.result(_.findWhere(DQC.data.heart, { name : drop.heart.name }), 'description');
          treasures.push('Fortune smiles upon thee, ' + enemy.defeated_by + ', for thou hast obtained the ' + drop.heart.name + ' heart.');
          treasures.push(helpers.format(heartDesc, false, true));
          if (character.heart.name) {
            treasures.push('Thou already have in thy possession a ' + character.heart.name + ' heart. '
              + 'Dost thou wish to discard it and accept the ' + drop.heart.name + ' heart instead?');
          } else {
            character.heart.name = drop.heart.name;
            // set heart experience to -1 so we know not to add the experience from this battle
            character.heart.experience = -1;
          }
          treasures.push('');
        }
      }
    });
  });

  _.each(scenario.characters, function (character) {
    if (character.in_battle && !character.is_dead && character.recruit) {
      recruits.push(character.recruit + ' got up and looked at ' + character.displayName() + ' with respect. Allow ' + character.recruit + ' to join thy monster team?');
      // Add monster to recruits roster, or show message if monster team is full
      addRecruit(character, character.recruit);
      recruits.push('');
    }
  });

  xpTotal = parseInt(xpTotal * multiplier, 10) || 0;
  goldTotal = parseInt(goldTotal * multiplier, 10) || 0;

  // Only 75-100% of enemy gold total is actually dropped.
  goldTotal -= parseInt((goldTotal * DQC.RNG.integer(0, 255)) / 1024, 10);

  DQC.out(helpers.format('VICTORY! All battlers receive ' + xpTotal + ' XP and ' + goldTotal + ' GP!', true));
  DQC.out();

  _.each(scenario.characters, function (character) {
    if (character.in_battle && !character.is_dead) {
      character.gold += goldTotal;
      characterHelpers.updateExperience(DQC, character, xpTotal);
    }
  });

  _.each(treasures, DQC.out);
  _.each(recruits, DQC.out);
}

// update scenario, character data after a full party wipeout
function wipeout (DQC, scenario) {
  var xpNeeded;
  var message = '"Death should not have taken thee. I shall give thee another chance.';

  // Wipe out scenario
  scenario.name = 'Fates Tempted';
  scenario.location = 'Tantegel Castle';
  scenario.map_position = 'C3';
  scenario.light_level = null;
  scenario.allies = [];
  scenario.battle.allies = {};
  scenario.battle.has_fronts = false;
  scenario.quest = null;
  scenario.in_quest = false;

  DQC.out(helpers.format('The party is wiped out.', true));
  DQC.out();
  // each character in the party has status restored but suffers XP/gold penalty
  _.each(scenario.characters, function (character) {
    character.curr_HP = character.max_HP;
    character.curr_MP = character.max_MP;
    character.is_dead = false;
    character.status  = [];
    character.effects = [];
    character.front   = null;
    xpNeeded = characterHelpers.deathPenalty(DQC, character);
    if (xpNeeded) {
      message += ' To reach the next level, ' + character.displayName() + "'s experience must increase by " + xpNeeded + '.';
    } else {
      message += ' ' + character.displayName() + ', thou art strong enough!';
    }
  });
  DQC.out();
  
  message += ' Go now, and tempt not the fates."';
  DQC.out(message);
  DQC.out();
}
