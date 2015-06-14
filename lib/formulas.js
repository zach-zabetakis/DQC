module.exports = {
  attackDecay    : attackDecay,
  criticalDamage : criticalDamage,
  multiplier     : multiplier,
  physicalDamage : physicalDamage,
  plink          : plink,
  plinkDamage    : plinkDamage,
  run            : run,
  turnOrder      : turnOrder
};

// multipliers for decay of physical attack damage when multi-targeting
function attackDecay (damage, count) {
  var decay      = [1.0, 0.8, 0.7, 0.5, 0.3, 0.2];
  var multiplier = decay[count] || decay.pop();

  if (damage) {
    damage = parseInt(damage * multiplier, 10) || 1;
  }

  return damage;
}

// generate random critical attack damage
function criticalDamage (attack, RNG) {
  var damage;

  // damage = ATK - ((ATK - rand(0, 255)) / 512)
  damage = attack - parseInt((attack * RNG.integer(0, 255)) / 512, 10);

  return damage;
}

// XP/gold rewards are adjusted by a multiplier based on the number
// of live, active characters in the current party.
function multiplier (party_size) {
  var multiplier = parseFloat(4 / party_size) || 0;
  return multiplier;
}

// generate random physical attack damage
function physicalDamage (attack, defense, RNG) {
  var DEF2 = parseInt(defense / 2, 10);
  var damage;

  // damage = (((ATK - DEF/2) + (((ATK - DEF/2 + 1) * rand(0, 255)) / 256)) / 4)
  damage = (attack - DEF2) + parseInt(((attack - DEF2 + 1) * RNG.integer(0, 255)) / 256, 10);
  damage = parseInt(damage / 4, 10);

  return damage;
}

// if the target's defense greatly outweighs the attacker's power,
// then the attack will 'plink' off of the target, dealing minimal damage.
// two different formulas depending on whether the attacker is an enemy or ally.
function plink (attack, defense, is_enemy) {
  var plink;

  if (is_enemy) {
    plink = attack < (2 + defense);
  } else {
    plink = attack < (2 + parseInt(defense / 2, 10));
  }

  return plink;
}

// generate random plink damage
// two different formulas depending on whether the attacker is an enemy or ally.
function plinkDamage (attack, defense, is_enemy, RNG) {
  var damage = 0;
  var B;

  if (is_enemy) {
    // for enemies, damage = (((((B/2 + 1) * rand(0, 255)) / 256) + 2) / 3
    // where B = max(5, ATK - ((12 * (DEF - ATK + 1)) / ATK))
    B = attack - parseInt((12 * (defense - attack + 1)) / attack, 10);
    B = Math.max(5, B);
    damage = parseInt(((parseInt(B/2, 10) + 1) * RNG.integer(0, 255))/ 256, 10);
    damage = parseInt((damage + 2) / 3);
  } else {
    // for characters/allies, damage = rand(0, 1)
    damage = RNG.integer(0, 1);
  }

  return damage;
}

// determine whether a character or ally will successfully flee from battle
// enemy used is the 'toughest' foe to run from
function run (player_run, enemy_run, RNG) {
  var success;

  // success IF player_run * rand(0, 255) >= enemy_run * rand(0, 255)
  success = parseInt(player_run * RNG.integer(0, 255), 10) >= parseInt(enemy_run * RNG.integer(0, 255), 10);

  return success;
}

// generate a random agility score used to calculate turn order
function turnOrder (agility, RNG) {
  var agi_score

  // turnOrder = AGI - (rand(0, 255) * (AGI - (AGI / 4)) / 256)
  agi_score = agility - parseInt((RNG.integer(0, 255) * (agility - parseInt(agility / 4, 10))) / 256, 10);

  return agi_score;
}
