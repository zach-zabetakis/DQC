var formulas = require(__dirname + '/formulas');
var _        = require('lodash');

var NULL_TARGET = { is_null : true, displayName : function () { return 'thin air'; } };

module.exports = function (battleHelpers) {
  return {
    chooseCommand        : chooseCommand,
    chooseTarget         : chooseTarget,
    confusionTargeting   : confusionTargeting,
    findMaxDamageGroup   : findMaxDamageGroup,
    findWeakestRemaining : findWeakestRemaining,
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
          // TODO: run custom AI function based on name
          action = 'NONE';
          break;
        case 'fixed':
          // loop through pattern array sequentially
          index  = ((scenario.battle.turn + attempt - 1) % pattern.length) || 0;
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
        if (spell.is_set) {
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
}
