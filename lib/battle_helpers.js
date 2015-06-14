var characterHelpers = require(__dirname + '/character_helpers');
var formulas         = require(__dirname + '/formulas');
var helpers          = require(__dirname + '/helpers');
var nconf            = require('nconf');
var _                = require('lodash');

var battleHelpers = module.exports = {
  applyOnHitEffects     : applyOnHitEffects,
  applyStatus           : applyStatus,
  checkHP               : checkHP,
  checkMP               : checkMP,
  checkStatusRecovery   : checkStatusRecovery,
  chooseEnemyTarget     : chooseEnemyTarget,
  clearBattleEffects    : clearBattleEffects,
  createNewGroup        : createNewGroup,
  cureStatus            : cureStatus,
  endOfTurn             : endOfTurn,
  expelFromBattle       : expelFromBattle,
  findMember            : findMember,
  findByHighestStat     : findByHighestStat,
  generateTurnOrder     : generateTurnOrder,
  getMultiplier         : getMultiplier,
  getSaver              : getSaver,
  groupType             : groupType,
  healDamage            : healDamage,
  isActive              : isActive,
  isIncapacitated       : isIncapacitated,
  isPlayerWipeout       : isPlayerWipeout,
  isRemaining           : isRemaining,
  performCommand        : performCommand,
  poison                : poison,
  regenHP               : regenHP,
  simulateCharacterTurn : simulateCharacterTurn,
  simulateMonsterTurn   : simulateMonsterTurn,
  simulateNPCTurn       : simulateNPCTurn,
  singleTargetAttack    : singleTargetAttack,
  takeDamage            : takeDamage,
  updateActiveGroups    : updateActiveGroups,
  victory               : victory,
  wipeout               : wipeout
};

// bypass circular dependency issue with dependency injection
var Commands = require(__dirname + '/commands')(battleHelpers);

// attempts to apply on-hit status or spell effect(s) to the target
function applyOnHitEffects (DQC, member, target) {
  var statuses = nconf.get('status');
  var onHits   = [];
  var message;
  var weapon;
  var heart;

  function applyOnHit (on_hit) {
    var resist = target.resist[on_hit.resist] || 0;
    var saver  = getSaver(on_hit.resist);

    if (!DQC.RNG.bool(resist, 16)) {
      if (saver && target.saver[saver] && DQC.RNG.bool(1, 4)) {
        // saved!
        onHits.push({ damage : 0, message : 'SAVED!' })
      } else {
        // apply the effect to the target
        if (_.includes(statuses, on_hit.effect) && !_.includes(target.status, on_hit.effect)) {
          message = applyStatus(on_hit.effect, target);
        } else if (/^SKILL/.test(on_hit.effect)) {
          // TODO: mimic a skill's effect
        } else if (/^SPELL/.test(on_hit.effect)) {
          // TODO: mimic a spell's effect
        }

        onHits.push({ damage : 0, message : message });
      }
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

  return onHits;
}

// applies a status effect and returns a status message
function applyStatus (status, member) {
  var statuses = nconf.get('status');
  var message;

  if (_.includes(statuses, status)) {
    member.status = _.union(member.status, [status]);
    switch (status) {
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
        if (member.type === 'character') {
          member.deaths++;
        }
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
function chooseEnemyTarget (DQC, scenario, enemy) {
  var group_options  = [];
  var member_options = [];
  var selected_group;
  var target_type;
  var target;

  // ally units only have a 25% chance of being targeted (compared to characters)
  var has_allies = !!_.findWhere(scenario.battle.allies.groups, { active : true });
  if (has_allies && DQC.RNG.bool(1, 4)) {
    target_type = 'allies';
  } else {
    target_type = 'characters';
  }

  // select the group to target (equal chance between each active group)
  _.each(scenario.battle[target_type].groups, function (group, index) {
    if (group.active) {
      group_options.push(index);
    }
  });

  if (group_options.length) {
    selected_group = group_options[DQC.RNG.integer(0, group_options.length - 1)];
    selected_group = scenario.battle[target_type].groups[selected_group];
  } else {
    throw new Error('No active ' + target_type + ' groups to select for scenario ' + scenario.name);
  }

  // select the member in the group to target (weighted by formation)
  _.each(selected_group.members, function (member, index) {
    if (!member.is_dead && member.can_target) {
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
    throw new Error('No targetable members in ' + target_type + ' group for scenario ' + scenario.name);
  }

  return target;
}

// remove all battle-only statuses and spell effects; reset stats
function clearBattleEffects (member) {
  member.status  = _.difference(member.status, ['BO', 'CF', 'FR', 'IR', 'SL', 'ST', 'SU']);
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
    active  : isActive(members)
  };

  return new_group;
}

// cures a status effect and returns a status message
function cureStatus (status, member) {
  var statuses = nconf.get('status');
  var message;

  if (_.includes(statuses, status)) {
    if (!_.includes(member.status, status)) {
      message = 'no effect.';
    } else {
      member.status = _.difference(member.status, [status]);
      switch (status) {
        case 'BO':
          message = 'the reflection shatters!';
          break;
        case 'CF':
          message = 'snaps out of confusion!';
          break;
        case 'DE':
          message = 'revived!';
          member.is_dead = false;
          delete member.defeated_by;
          member.curr_HP = 1;
          break;
        case 'FR':
          message = 'fear subsides!';
          break;
        case 'IR':
          message = 'develops an iron deficiency!';
          break;
        case 'NU':
          message = 'cured of paralysis!';
          break;
        case 'PO':
          message = 'cured of poison!';
          break;
        case 'SL':
          message = 'wakes up!';
          break;
        case 'ST':
          message = 'the seal is broken!';
          break;
        case 'SU':
          message = 'the illusion clears!';
          break;
      }
    }
  }

  return message;
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

      member.target = undefined;
      member.command = undefined;
    });
  }

  _.each(scenario.battle.characters.groups, turnCleanup);
  _.each(scenario.battle.allies.groups, turnCleanup);
  _.each(scenario.battle.enemies.groups, turnCleanup);

  if (isIronize) {
    DQC.out('The effects of Ironize wear off.');
  }
}

// remove the selected member from the battle scenario
function expelFromBattle (scenario, member) {
  var group_type = groupType(member);
  _.each(scenario.battle[group_type].groups, function (group, group_index) {
    var index = _.findIndex(group.members, member);
    if (index > -1) {
      group.members.splice(index, 1);
      member.in_battle = false;
      clearBattleEffects(member);

      // remove the group from battle if it does not have any members
      if (!group.members.length) {
        scenario.battle[group_type].groups.splice(group_index, 1);
      }

      // break out of the loop early
      return false;
    }
  });

  updateActiveGroups(scenario, group_type);
}

// loop over all members and return the one with the highest stat
function findByHighestStat (scenario, groupType, stat_name) {
  var match = {};
  match[stat_name] = -1;

  if (groupType && scenario.battle[groupType]) {
    _.each(scenario.battle[groupType].groups, function (group) {
      _.each(group.members, function (member) {
        if (member[stat_name] > match[stat_name]) {
          match = member;
        }
      });
    });
  } else {
    match = undefined;
  }

  return match;
}

// loop over all members of a battle and return the first match found
function findMember (scenario, searchMember, groupType) {
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

  if (groupType && scenario.battle[groupType]) {
    // loop only over the specified group
    _.each(scenario.battle[groupType].groups, groupFind);

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
  var ment = ['beat', 'numb', 'poison', 'sap', 'slow'];
  var phys = ['chaos', 'robmagic', 'sleep', 'stopspell', 'surround'];

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

// check if a member is able to take a turn in battle
// cannot act if dead, fear, numb, or sleep
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

// perform a command for a member in battle
function performCommand (DQC, scenario, member) {
  if (!member.command) {
    throw new Error('Command for ' + member.name + ' not found.');
  }

  var type = (member.command.type || '').toLowerCase();
  var message;

  try {
    eval('message = Commands.' + type + '(DQC, scenario, member);');
  } catch (err) {
    throw new Error(err);
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

// simulate a single character's turn in battle
function simulateCharacterTurn (DQC, scenario, character) {
  var dispName = character.displayName();
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
        break;
      default:
        // TODO: player confusion
        message += '';
        break;
    }
    hasTurn = false;
  }

  if (hasTurn) {
    if (character.command) {
      // perform the command
      message += performCommand(DQC, scenario, character);

    } else {
      // TODO: prompt for command from console
    }
  }

  if (character.in_battle) {
    if (!character.is_dead && _.includes(character.status, 'PO')) {
      amount = poison(scenario, character);
      message += ' Poison! Lost ' + amount + ' HP!';
      if (character.is_dead) {
        message += helpers.format(' Thou art dead.', true);
      }
    }

    if (!character.is_dead && character.regen) {
      amount = regenHP(scenario, character);
      message += ' Regen! Gained ' + amount + ' HP!';
    }
  }

  DQC.out(message);
}

// simulate a single monster's turn in battle
function simulateMonsterTurn (DQC, scenario, monster) {
  var dispName = monster.displayName();
  var target   = monster.target || {};
  var hasTurn  = true;
  var message  = '';
  var index, action, amount;

  // See if a monster can recover from its incapacitated state
  if (isIncapacitated(monster)) {
    message += checkStatusRecovery(DQC, scenario, monster);
    hasTurn = false;
  }

  // Perform a flee check for enemy monsters.
  if (monster.is_enemy) {
    // if target STR >= monster attack * 2, the monster will flee at a 25% rate
    if ((monster.attack * 2) <= target.adj_strength) {
      if (DQC.RNG.bool(1, 4)) {
        DQC.out(dispName + ' is running away.');
        expelFromBattle(scenario, monster);
        return;
      }
    }
  }

  if (hasTurn && _.includes(monster.status, 'CF')) {
    switch (DQC.RNG.integer(1, 4)) {
      case 1:
        monster.status = _.difference(monster.status, ['CF']);
        message += dispName + ' snaps out of confusion!';
        break;
      case 2:
        // TODO: physical attack
        break;
      case 3:
        // TODO: magic spell
        break;
      case 4:
        message += dispName + ' ' + (monster.flavor.confusion || 'is flustered!');
        break;
      default:
        throw new Error('Unknown confusion option');
    }
    hasTurn = false;
  }

  if (hasTurn) {
    if (!monster.is_enemy) {
      // TODO: get allied monster command
    }

    // choose this monster's battle action
    if (!action) {
      switch (monster.behavior) {
        case 'fixed':
          // loop through pattern array sequentially
          index  = (scenario.battle.turn % monster.pattern.length) || 0;
          action = monster.pattern[index];
          break;
        case 'random':
          // pick a random action from the pattern array
          index  = DQC.RNG.integer(0, monster.pattern.length - 1);
          action = monster.pattern[index];
          break;
        case 'custom':
          // TODO: specific monster AI? manual control?
          break;
        case 'none':
          // no attacks, exit out of the monster turn
          return;
          break;
        default:
          throw new Error('Unknown behavior for monster ' + dispName);
          break;
      }
    }

    // TODO: perform the action
    message += dispName + ' ' + action + 's ' + target.displayName() + '!';
  }

  if (monster.in_battle) {
    if (!monster.is_dead && _.includes(monster.status, 'PO')) {
      amount = poison(scenario, monster);
      message += ' Poison! Lost ' + amount + ' HP!';
      if (monster.is_dead) {
        message += ' Defeated!';
      }
    }

    if (!monster.is_dead && monster.regen) {
      amount = regenHP(scenario, monster);
      message += ' Regen! Gained ' + amount + ' HP!';
    }
  }

  DQC.out(message);
}

// simulate a single NPC's turn in battle
function simulateNPCTurn (DQC, scenario, npc) {
  var dispName = npc.displayName();
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
        break;
      default:
        // TODO: player confusion
        message += '';
        break;
    }
    hasTurn = false;
  }

  if (hasTurn) {
    // TODO: perform the action
    message += dispName + ' cackles with glee!';
  }

  if (npc.in_battle) {
    if (!npc.is_dead && _.includes(npc.status, 'PO')) {
      amount = poison(scenario, npc);
      message += ' Poison! Lost ' + amount + ' HP!';
      if (npc.is_dead) {
        message += helpers.format(' Defeated!', true);
      }
    }

    if (!npc.is_dead && npc.regen) {
      amount = regenHP(scenario, npc);
      message += ' Regen! Gained ' + amount + ' HP!';
    }
  }

  DQC.out(message);
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
    damage    : 0,
    onHits    : undefined
  };

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
    if (target.parry) {
      results.damage = parseInt(results.damage / 2, 10);
    }

    if (results.damage && results.damage < target.curr_HP) {
      // attempt to apply on-hit effects to alive targets only
      results.onHits = applyOnHitEffects(DQC, member, target);
    }
  }

  return results;
}

// inflicts the amount of damage passed in
function takeDamage (scenario, member, amount) {
  if (!member.is_dead) {
    member.curr_HP -= amount;
    checkHP(member);
    if (member.is_dead) {
      if (member.type === 'character') {
        member.deaths++;
      }
      updateActiveGroups(scenario, groupType(member));
    }
  }
}

// updates the active flags for each group
// also recalculates the group_index for each member
function updateActiveGroups (scenario, group_type) {
  _.each(scenario.battle[group_type].groups, function (group, group_index) {
    group.active = isActive(group.members);
    _.each(group.members, function (member) { member.group_index = group_index; });
  });
}

// update scenario after a battle victory
function victory (DQC, scenario) {
  var multiplier = getMultiplier(scenario);
  var xpTotal    = 0;
  var goldTotal  = 0;
  var treasures  = [];

  function addItem (character, item) {
    var nonInventory = ['Loto 3 Ticket', 'Ball of Light Ticket'];
    if (nonInventory.indexOf(item) === -1) {
      character.inventory.push(item);
      if (character.inventory.length > nconf.get('inventory_limit')) {
        treasures.push('Thine inventory is full. Please specify one of the following items to use, transfer, or drop:');
        treasures.push(character.inventory.join(', '));
      }
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

  // update scenario
  scenario.in_battle = false;
  if (scenario.battles_remaining) {
    scenario.battles_remaining--;
  }
  scenario.battle.turn = null;
  scenario.battle.enemies = {};
}

// update scenario, character data after a full party wipeout
function wipeout (DQC, scenario) {
  var xpNeeded;
  var message = '"Death should not have taken thee. I shall give thee another chance.';

  // Wipe out scenario
  scenario.name = 'Fate Tempted';
  scenario.location = 'Tantegel';
  scenario.map_position = ''; // TODO
  scenario.light_level = null;
  scenario.allies = [];
  scenario.quest = null;
  scenario.in_quest = false;
  scenario.in_battle = false;
  scenario.battles_remaining = null;
  scenario.battle.turn = null;
  scenario.battle.allies = {};
  scenario.battle.enemies = {};

  DQC.out(helpers.format('The party is wiped out.', true));
  DQC.out();
  // each character in the party has status restored but suffers XP/gold penalty
  _.each(scenario.characters, function (character) {
    character.curr_HP = character.max_HP;
    character.curr_MP = character.max_MP;
    character.is_dead = false;
    character.status  = [];
    character.effects = [];
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
