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
    var dispName   = member.displayName();
    var target     = member.command.target;
    var targetName = target.displayName();
    var message    = '';
    var damage     = 0;
    var is_miss    = false;
    var is_crit    = false;
    var is_dodge   = false;
    var is_plink   = false;
    var ATK, DEF;
    var onHits;

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

      is_miss   = DQC.RNG.bool(member.adj_miss, 32);
      is_crit   = DQC.RNG.bool(member.adj_critical, 32);
      is_dodge  = DQC.RNG.bool(target.adj_dodge, 256);
      is_on_hit = member.on_hit && DQC.RNG.bool(member.on_hit.chance, 32);

      if (!is_miss && !is_dodge) {
        if (is_crit) {
          // damage according to critical hit formula
          damage  = formulas.criticalDamage(ATK, DQC.RNG);
        } else {
          is_plink = formulas.plink(ATK, DEF, member.is_enemy);
          if (is_plink) {
            // damage according to plink formula
            damage = formulas.plinkDamage(ATK, DEF, member.is_enemy, DQC.RNG);
          } else {
            // damage according to standard physical attack formula
            damage = formulas.physicalDamage(ATK, DEF, DQC.RNG);
          }
        }
        if (target.parry) {
          damage = parseInt(damage / 2, 10);
        }

        if (damage) {
          // attempt to apply on-hit effects
          onHits = battleHelpers.applyOnHitEffects(DQC, member, target);
        }
      }

      // construct message line
      if (is_miss && _.includes(member.status, 'SU')) {
        message = dispName + ' is beguiled by illusions!';
      } else {
        message = dispName + ' ' + prefix + ' ' + targetName + suffix + '!';
        if (is_crit)  {
          message += (member.is_enemy) ? ' A terrible blow!' : ' Excellent move!';
        }
        if (is_miss) {
          message += ' Attack missed!';
        } else if (is_dodge) {
          message += ' ' + targetName + ' ' + ((target.flavor && target.flavor.dodge) || 'smoothly dodges the attack') + '!';
        } else if (!damage) {
          message += ' Attack failed!'
        } else if (!target.is_dead) {
          message += ' Lost ' + damage + ' HP.';

          _.each(onHits, function (onHit) {
            damage += onHit.damage;
            message += ' ' + onHit.message;
          });

          // apply damage to target
          battleHelpers.takeDamage(scenario, target, damage);
          if (target.is_dead) {
            message += (target.type === 'character') ? helpers.format(' Thou art dead.', true) : ' - Defeated!';
          }
        }
      }
    }

    return message;
  }

  // Move forward in the group ordering
  // Coupled with PARRY command to halve incoming damage for the turn.
  // Display message only, reordering takes place before the start of the turn.
  function charge (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' charges ahead!';

    return message;
  }

  // Use monster heart power
  function heart (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' is using heart powers!';

    return message;
  }

  // Use item
  function item (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' is using an item!';

    return message;
  }

  // Do nothing
  function none (DQC, scenario, member) {
    var dispName = member.displayName();
    var flavor   = (member.flavor && member.flavor.idle) || 'is assessing the situation.';
    var message  = dispName + ' ' + flavor;

    return message;
  }

  // Parry incoming attacks, halving damage for the turn
  // Display purposes only, damage protection takes place before the start of the turn.
  function parry (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' is on guard!';

    return message;
  }

  // Fall back in the group ordering
  // Coupled with PARRY command to halve incoming damage for the turn.
  // Display message only, reordering takes place before the start of the turn.
  function retreat (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' falls back!';

    return message;
  }

  // Run away
  function run (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' is running away!';

    return message;
  }

  // Shift to another group (switch groups)
  function shift (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' switches groups!';

    return message;
  }

  // Cast a spell
  function spell (DQC, scenario, member) {
    var dispName = member.displayName();
    var message  = dispName + ' is casting a spell!';

    return message;
  }

};

