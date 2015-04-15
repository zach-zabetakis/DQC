var formulas = require(__dirname + '/formulas');
var _        = require('lodash');

module.exports = function (battleHelpers) {
  return {
    attack  : attack,
    charge  : charge,
    heart   : heart,
    item    : item,
    none    : none,
    parry   : parry,
    retreat : retreat,
    run     : run,
    shift   : shift,
    spell   : spell
  };

  // Standard physical attack
  function attack (DQC, scenario, member) {
    var dispName   = member.name + (member.symbol || '');
    var target     = member.command.target;
    var targetName = target.name + (target.symbol || '');
    var message    = '';
    var damage     = 0;
    var plink;
    var ATK, DEF;

    var prefix = (member.command.flavor_prefix || '').trim();
    if (!prefix && member.flavor && _.isArray(member.flavor.attack)) {
      prefix = member.flavor.attack[DQC.RNG(0, member.flavor.attack.length - 1)] || 'attacks';
    } else if (!prefix) {
      prefix = 'attacks';
    }
    var suffix = (member.command.flavor_suffix || '').trim();
    suffix = suffix ? ' ' + suffix : suffix;

    if (member.target_all) {
      // attack all members of the opposing side

    } else if (member.target_group) {
      // look up group containing the target

    } else {
      // single target attack
      ATK = member.curr_attack;
      DEF = target.curr_defense;

      plink = formulas.plink(ATK, DEF, member.is_enemy);
      if (plink) {
        // plink
        damage = formulas.plinkDamage(ATK, DEF, member.is_enemy, DQC.RNG);
      } else {
        // normal damage
        damage = formulas.physicalDamage(ATK, DEF, DQC.RNG);
      }

      // apply damage to target
      message = dispName + ' ' + prefix + ' ' + targetName + suffix + '!';
      message += damage ? ' Lost ' + damage + ' HP.' : ' Attack failed!';
      if (!target.is_dead) {
        battleHelpers.takeDamage(scenario, target, damage);
        if (target.is_dead) {
          message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : ' - Defeated!';
        }
      }
    }

    return message;
  }

  // Move forward in the group ordering
  // Coupled with PARRY command to halve incoming damage for the turn.
  // Display message only, reordering takes place before the start of the turn.
  function charge (DQC, scenario, member) {
    var dispName = member.name + (member.symbol || '');
    var message  = dispName + ' charges ahead!';

    return message;
  }

  // Use monster heart power
  function heart (DQC, scenario, member) {
    var dispName = member.name + (member.symbol || '');
    var message  = dispName + ' is using heart powers!';

    return message;
  }

  // Use item
  function item (DQC, scenario, member) {
    var dispName = member.name + (member.symbol || '');
    var message  = dispName + ' is using an item!';

    return message;
  }

  // Do nothing
  function none (DQC, scenario, member) {
    var dispName = member.name + (member.symbol || '');
    var flavor   = (member.flavor && member.flavor.idle) || 'is assessing the situation.';
    var message  = dispName + ' ' + flavor;

    return message;
  }

  // Parry incoming attacks, halving damage for the turn
  // Display purposes only, damage protection takes place before the start of the turn.
  function parry (DQC, scenario, member) {
    var dispName = member.name + (member.symbol || '');
    var message  = dispName + ' is on guard!';

    return message;
  }

  // Fall back in the group ordering
  // Coupled with PARRY command to halve incoming damage for the turn.
  // Display message only, reordering takes place before the start of the turn.
  function retreat (DQC, scenario, member) {
    var dispName = member.name + (member.symbol || '');
    var message  = dispName + ' falls back!';

    return message;
  }

  // Run away
  function run (DQC, scenario, member) {
    var dispName = member.name + (member.symbol || '');
    var message  = dispName + ' is running away!';

    return message;
  }

  // Shift to another group (switch groups)
  function shift (DQC, scenario, member) {
    var dispName = member.name + (member.symbol || '');
    var message  = dispName + ' switches groups!';

    return message;
  }

  // Cast a spell
  function spell (DQC, scenario, member) {
    var dispName = member.name + (member.symbol || '');
    var message  = dispName + ' is casting a spell!';

    return message;
  }

};

