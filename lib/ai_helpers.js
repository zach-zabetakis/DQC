var formulas = require(__dirname + '/formulas');
var helpers  = require(__dirname + '/helpers');
var _        = require('lodash');

var NULL_TARGET = { is_null : true, displayName : function () { return 'thin air'; } };

module.exports = function (battleHelpers) {
  //
  // Define custom AI routines that will allow for complex battle logic
  //
  var customAI = {
    logicBoxslime : function (DQC, scenario, boxslime) {
      var count  = 0;
      var action;

      _.each(boxslime.effects, function (effect) {
        if (effect === 'Open Up-A' || effect === 'Open Up-D') {
          count++;
        }
      });

      // 50% chance to open up, can be stacked to a max of 2
      if (count < 2 && DQC.RNG.bool()) {
        action = 'SKILL:Open Up';
      } else {
        action = 'ATTACK';
      }

      return action;
    },
    logicMagibabble : function (DQC, scenario, magibabble) {
      var action;

      // start battle with 0 MP
      if (scenario.battle.turn === 0) {
        magibabble.curr_MP = 0;
      }

      // 50% chance to cast Robmagic/Bang based on current MP level
      if (DQC.RNG.bool()) {
        action = (magibabble.curr_MP < 5) ? 'SPELL:Robmagic' : 'SPELL:Bang';
      } else {
        // 37.5% chance to use Sleep Strike, otherwise ATTACK
        action = (DQC.RNG.bool(3, 8)) ? 'SKILL:Sleep Strike' : 'ATTACK';
      }

      return action;
    },
    logicMarineSlime : function (DQC, scenario, marineslime) {
      var count = 0;
      var action;

      _.each(marineslime.effects, function (effect) {
        if (effect === 'Increase') {
          count++;
        }
      });

      // 62.5% chance to cast Increase, decreasing with each layer stacked
      if (DQC.RNG.bool(5 - count, 8)) {
        action = 'SPELL:Increase';
      } else {
        // 25% chance to use Freeze Hit; otherwise ATTACK
        action = (DQC.RNG.bool(1, 4)) ? 'SKILL:Freeze Hit' : 'ATTACK';
      }

      return action;
    }
  };

  return {
    chooseCommand         : chooseCommand,
    chooseTarget          : chooseTarget,
    confusionTargeting    : confusionTargeting,
    findMaxDamageGroup    : findMaxDamageGroup,
    findWeakestRemaining  : findWeakestRemaining,
    setCommandBeDragon    : setCommandBeDragon,
    setCommandRandomSpell : setCommandRandomSpell,
  };


  // choose a command based on all available factors
  function chooseCommand (DQC, scenario, member) {
    // bypass circular dependency issue with dependency injection
    var Commands = require(__dirname + '/../lib/commands')(battleHelpers);

    var random1 = [125, 125, 125, 125, 125, 125, 125, 125];
    var random2 = [220, 200, 180, 160, 90, 70, 50, 30];
    var random3 = _.clone(random2).reverse();
    var pattern = member.pattern || [];
    var isValid = false;
    var attempt = 0;
    var logicFunction;
    var number;
    var action;
    var target;
    var index;

    function selectPattern (probability, index) {
      number -= probability;
      if (number <= 0) {
        action = pattern[index];
        return false;
      }
    }

    // Try up to 8 times to produce a valid command
    // Else default to a physical attack
    while (!isValid) {
      number = DQC.RNG.integer(1, 1000);
      attempt++;

      if (attempt > 8) {
        action = 'ATTACK';
        target = chooseTarget(DQC, scenario, member, action);
        break;
      }

      switch (member.behavior) {
        case 'custom':
          // run custom AI function based on name
          logicFunction = 'logic' + helpers.toFunctionName(member.species || member.name);
          if (typeof customAI[logicFunction] === 'function') {
            action = customAI[logicFunction](DQC, scenario, member);
          } else {
            action = 'NONE';
          }
          break;
        case 'fixed':
          // loop through pattern array sequentially
          member.position = member.position || 0;
          index = (member.position++ % pattern.length);
          action = pattern[index];
          break;
        case 'random1':
          // each move has an equal chance to be picked
          _.each(random1, selectPattern);
          break;
        case 'random2':
          // pattern array is weighted from more to less likely
          _.each(random2, selectPattern);
          break;
        case 'random3':
          // patern array is weighted, but is reversed if HP is low
          if (member.curr_HP * 4 <= member.max_HP) {
            _.each(random3, selectPattern);
          } else {
            _.each(random2, selectPattern);
          }
          break;
        case 'none':
        default:
          // no command is chosen, no action is taken
          action = 'NONE';
          break;
      }

      // choose target
      target = chooseTarget(DQC, scenario, member, action);


      // validate command
      if (typeof target !== 'undefined') {
        if (_.includes(member.status, 'CF')) {
          // if confused, flip to a random target on the opposite side of battle
          target = confusionTargeting(DQC, scenario, member, target);
        }

        isValid = true;
      }
    }

    if (action) {
      action = action.split(':');
      member.command = {
        type     : action[0],
        name     : action[1],
        member   : member,
        target   : target
      };

    } else {
      member.command = {
        type     : 'NONE',
        member   : member,
        target   : _.clone(NULL_TARGET),
      };
    }

    Commands.setPriority(DQC.data, member.command);
  }

  // choose an appropriate target for a given action
  // if a target cannot be found return undefined
  function chooseTarget (DQC, scenario, member, action) {
    action = action.split(':');
    var type = action[0];
    var name = action[1];
    var target;

    switch (type) {
      case 'ATTACK':
        if (member.is_enemy) {
          target = battleHelpers.chooseEnemyTarget(DQC, scenario, member, member.front) || _.clone(NULL_TARGET);
        } else {
          if (member.target_group) {
            var groupPool   = battleHelpers.getAllGroups(scenario, 'enemies', member.front, true);
            var targetGroup = findMaxDamageGroup(groupPool, { type : 'physical', attack : member.curr_attack, miss : member.adj_miss });
            if (targetGroup && targetGroup.members.length) {
              target = targetGroup.members[DQC.RNG.integer(0, targetGroup.members.length - 1)];
            }
            target = target || _.clone(NULL_TARGET);
          } else {
            target = findWeakestRemaining(scenario, 'enemies', null, member.front, true) || _.clone(NULL_TARGET);
          }
        }
        break;
      case 'SKILL':
        var Skill = require(__dirname + '/skills');
        var skill = new Skill(name, DQC.data);
        if (skill.is_set) {
          target = skill.chooseTarget(DQC, scenario, member);
        }
        break;
      case 'SPELL':
        var Spell = require(__dirname + '/spells');
        var spell = new Spell(name, DQC.data);
        if (spell.is_set && spell.canCast(member)) {
          target = spell.chooseTarget(DQC, scenario, member);
        }
        break;
      case 'NONE':
      case 'PARRY':
      case 'RUN':
        // these actions have no target
        target = _.clone(NULL_TARGET);
        break;
      case 'CHARGE':
      case 'HEART':
      case 'ITEM':
      case 'RETREAT':
      case 'SHIFT':
      default:
        // these actions should not be able to be selected by the AI
        throw new Error('Command type ' + type + ' is not valid for member ' + member.displayName() + '.');
        break;
    }

    return target;
  }

  // under the effects of confusion, targeting will be randomized, but on the opposite side of battle
  function confusionTargeting (DQC, scenario, member, previousTarget) {
    var targetEnemySide = previousTarget ? !previousTarget.is_enemy : member.is_enemy;
    var memberPool      = [];
    var target;

    // if we have a previous target, assume it would be detrimental to the opposing side.
    // with no previous target attack will be against the member's side of battle
    if (targetEnemySide) {
      memberPool = battleHelpers.getAllMembers(scenario, 'enemies', null, member.front);
    } else {
      memberPool = battleHelpers.getAllMembers(scenario, 'characters', null, member.front);
      memberPool.concat(battleHelpers.getAllMembers(scenario, 'allies', null, member.front));
    }

    memberPool = _.filter(memberPool, battleHelpers.isTargetable);
    if (memberPool.length) {
      target = memberPool[DQC.RNG.integer(0, memberPool.length - 1)];
    } else {
      target = member;
    }

    return target;
  }

  // find the group that will be most susceptible to a particular attack
  // covers physical attacks, offensive spells/skills, and status attacks
  function findMaxDamageGroup (groups, options) {
    var maxDamage     = 0;
    var averageDamage = 0;
    var maxDamageGroup;
    var damage;
    var resist;

    _.each(groups, function (group) {
      averageDamage = 0;
      // for each group, calculate the total average damage across all targetable members
      _.each(group.members, function (member) {
        if (battleHelpers.isTargetable(member)) {
          if (options.type === 'physical') {
            // calculate average physical attack damage
            // REQUIRED options : attack, miss
            damage = formulas.physicalDamageAVG(options.attack, member.curr_defense);
            damage *= parseFloat(32 - (parseInt(options.miss, 10) || 0) / 32);
            damage *= parseFloat(256 - (parseInt(member.adj_dodge, 10) || 0) / 256);
            averageDamage += damage;

          } else if (options.type === 'offensive') {
            // factor in resists to find group most vulnerable to spell/skill
            // REQUIRED options : minimum, range, resist
            damage = parseFloat((2 * parseInt(options.minimum, 10) + parseInt(options.range, 10)) / 2);
            resist = parseFloat(16 - (parseInt(member.resist[options.resist], 10) || 0) / 16);
            averageDamage += parseFloat(damage * resist);

          } else if (options.type === 'status') {
            // factor in resists to find group most vulnerable to status
            // REQUIRED options : status, resist
            resist = parseFloat(16 - (parseInt(member.resist[options.resist], 10) || 0) / 16);
            averageDamage += _.includes(member.status, options.status) ? 0 : parseFloat(1 * resist);
          
          } else if (options.type === 'debuff') {
            // factor in resists to find group most vulterable to debuff
            // REQUIRED options: resist, stat
            resist = parseFloat(16 - (parseInt(member.resist[options.resist], 10) || 0) / 16);
            averageDamage += (member[options.stat] === 0) ? 0 : parseFloat(1 * resist);
          }
        }
      });

      if (averageDamage > maxDamage) {
        maxDamage = averageDamage;
        maxDamageGroup = group;
      }
    });

    return maxDamageGroup;
  }

  // find the 'weakest' (by survival score) target remaining for a given group(s) in battle
  // can be further filtered to only choose targets which are not incapacitated.
  // returns undefined if no target can be found
  function findWeakestRemaining (scenario, group_type, group_index, front, filter_active) {
    var target_members = battleHelpers.getAllMembers(scenario, group_type, group_index, front);
    var weakestRemaining;
    var weakestActive;
    var target;

    if (target_members.length) {
      // filter by targetable members only
      target_members = _.filter(target_members, battleHelpers.isTargetable);
      // sort by survivability score
      target_members = _.sortBy(target_members, function (member) {
        return formulas.survival(member, true);
      });

      if (target_members.length) {
        weakestRemaining = target_members.slice(-1)[0];
        if (filter_active) {
          weakestActive = _.filter(target_members, function (member) { return !battleHelpers.isIncapacitated(member); }).pop();
        }

        target = weakestActive || weakestRemaining;
      }
    }

    return target;
  }

  // logic for a member under the effects of BeDragon
  function setCommandBeDragon (DQC, scenario, member) {
    var target = target = chooseTarget(DQC, scenario, member, 'SKILL:Intense Flames');
    if (target) {
      member.command = {
        type   : 'SKILL',
        name   : 'Intense Flames',
        member : member,
        target : target
      };
    }
  }

  // pick a random spell that a playable character is able to cast
  // will default to doing nothing if a target cannot be found after 8 attempts
  function setCommandRandomSpell (DQC, scenario, member) {
    if (member.type !== 'character') { return; }

    var validSpells = _.filter(DQC.data.spell, function (spell) {
      return (spell.learned[member.job] && spell.level <= member.level);
    });
    var attempts = 8;
    var randomSpell;
    var target;

    do {
      randomSpell = validSpells[DQC.RNG.integer(0, validSpells.length - 1)];
      if (randomSpell && randomSpell.type !== 'travel') {
        target = chooseTarget(DQC, scenario, member, 'SPELL:' + randomSpell.name);
        if (target) {
          target = confusionTargeting(DQC, scenario, member, target);
        }
      }
    } while (typeof target === 'undefined' && attempts-- > 0);

    if (target) {
      member.command = {
        type     : 'SPELL',
        name     : randomSpell.name,
        member   : member,
        target   : target
      };
    }
  }
}
