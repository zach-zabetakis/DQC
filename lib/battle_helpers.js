var characterHelpers = require(__dirname + '/character_helpers');
var formulas         = require(__dirname + '/formulas');
var helpers          = require(__dirname + '/helpers');
var nconf            = require('nconf');
var _                = require('lodash');

var battleHelpers = module.exports = {
  applyOnHitEffects     : applyOnHitEffects,
  checkHP               : checkHP,
  checkStatusRecovery   : checkStatusRecovery,
  chooseEnemyTarget     : chooseEnemyTarget,
  expelFromBattle       : expelFromBattle,
  findMember            : findMember,
  generateTurnOrder     : generateTurnOrder,
  getMultiplier         : getMultiplier,
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
  takeDamage            : takeDamage,
  updateActiveGroups    : updateActiveGroups,
  victory               : victory,
  wipeout               : wipeout
};

// bypass circular dependency issue with dependency injection
var Commands = require(__dirname + '/commands')(battleHelpers);

// attempts to apply on-hit status or spell effect(s) to the target
function applyOnHitEffects (DQC, member, target) {
  var onHits = [];
  var weapon;
  var heart;

  function applyOnHit (onHit) {
    
  }

  if (member.on_hit && member.on_hit.chance) {
    if (DQC.RNG.bool(member.on_hit.chance, 32)) {
      applyOnHit(member.on_hit);
    }
  }

  if (member.equip && member.equip.weapon) {
    weapon = _.find(DQC.data.weapon, { name : member.weapon });
    if (weapon && weapon.on_hit.chance && DQC.RNG.bool(weapon.on_hit.chance, 32)) {
      applyOnHit(weapon.on_hit);
    }
  }

  if (member.heart) {
    heart = _.find(DQC.data.heart, { name : member.heart });
    if (heart && heart.on_hit.chance && DQC.RNG.bool(heart.on_hit.chance, 32)) {
      applyOnHit(heart.on_hit);
    }
  }

  return onHits;
}

// check that current HP is in bounds and set flags if dead
function checkHP (member) {
  // curr_HP cannot be greater than max_HP
  member.curr_HP = Math.min(member.curr_HP, member.max_HP);
  member.curr_HP = Math.max(member.curr_HP, 0);

  if (member.curr_HP === 0) {
    member.is_dead = true;
    member.status  = ['DE'];
    if (member.type === 'character') {
      member.deaths++;
    }
  } else {
    member.is_dead = false;
    member.status  = _.difference(member.status, ['DE']);
  }
}

// check for automatic recovery from various status ailments
// each check is independant of the others.
function checkStatusRecovery (DQC, scenario, member) {
  var message   = member.displayName();
  var separator = '';

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
    selected_group = group_options[DQC.RNG.integer(0, group_options.length -1)];
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

// remove the selected member from the battle scenario
function expelFromBattle (scenario, member) {
  var group_type = groupType(member);
  _.each(scenario.battle[group_type].groups, function (group, group_index) {
    var index = _.findIndex(group.members, member);
    if (index > -1) {
      group.members.splice(index, 1);
      member.in_battle = false;

      // either remove the group from the battle or update active status
      if (!group.members.length) {
        scenario.battle[group_type].groups.splice(group_index, 1);
      } else {
        group.active = isActive(group.members);
      }

      // break out of the loop early
      return false;
    }
  });
}

// loop over all members of a battle and return the first match found
function findMember(scenario, searchMember, groupType) {
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
  return !!_.intersection(member.status, ['DE', 'FR', 'NU', 'SL']).length;
}

// check if all players have been defeated
function isPlayerWipeout (scenario) {
  return !!_.findWhere(scenario.characters, { is_dead : false });
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
    throw new Error('Unknown command type ' + type);
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

  DQC.out(message);
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
function updateActiveGroups (scenario, group_type) {
  _.each(scenario.battle[group_type].groups, function (group) {
    group.active = isActive(group.members);
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
        treasures.push('Thy inventory is full. Please specify one of the following items to use, transfer, or drop:');
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
            treasures.push('Thou already have in thine possession a ' + character.heart.name + ' heart. '
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
