var helpers = require(__dirname + '/helpers');
var nconf   = require('nconf');
var _       = require('lodash');

module.exports = {
  calculateStatGrowths  : calculateStatGrowths,
  checkLevel            : checkLevel,
  deathPenalty          : deathPenalty,
  updateExperience      : updateExperience,
};

// calculate and apply level up stat growths
function calculateStatGrowths (DQC, character) {
  var growths    = {};
  var buildTable = DQC.data['build_' + character.job];
  var index      = character.level - 1;
  var build      = character.build;
  var mod        = build % 4;
  var bonus      = 16;

  if (!buildTable) {
    throw new Error('No build table for job ' + character.job + ' found.');
  }

  // STR1: odd builds, STR2: even builds
  if (build % 2 === 1) {
    growths.STR = buildTable.STR1[index];
  } else {
    growths.STR = buildTable.STR2[index];
  }
  growths.STR += DQC.RNG.bool(1, bonus) ? 1 : 0;
  character.base_strength += growths.STR || 0;

  // AGI1: mod=2|3, AGI2: mod=0|1
  if (mod === 2 || mod === 3) {
    growths.AGI = buildTable.AGI1[index];
  } else {
    growths.AGI = buildTable.AGI2[index];
  }
  growths.AGI += DQC.RNG.bool(1, bonus) ? 1 : 0;
  character.base_agility += growths.AGI || 0;

  // HP1: mod=0|1, HP2: mod=2|3
  if (mod === 0 || mod === 1) {
    growths.HP = buildTable.HP1[index];
  } else {
    growths.HP = buildTable.HP2[index];
  }
  growths.HP += DQC.RNG.bool(1, bonus) ? 1 : 0;
  character.base_HP += growths.HP || 0;

  // MP1: even builds, MP2: odd builds
  if (build % 2 === 1) {
    growths.MP = buildTable.MP1[index];
  } else {
    growths.MP = buildTable.MP2[index];
  }
  growths.MP += DQC.RNG.bool(1, bonus) ? 1 : 0;
  character.base_MP += growths.MP || 0;

  return growths;
}

// Checks a character's level based on job class and current experience
function checkLevel (xpTable, job, experience) {
  var level = 1 + _.findLastIndex(xpTable[job], function (num) {
    return num <= experience;
  });

  return level;
}

// death penalty is 50% of gold and 10% of XP needed to reach next level
// no XP penalty if already at max level
function deathPenalty (DQC, character) {
  var xpTable   = DQC.data.experience[character.job];
  var xpCurrent = xpTable[character.level - 1];
  var xpNext    = xpTable[character.level];
  var xpPenalty = 0;
  var xpNeeded  = 0;

  if (xpNext) {
    xpPenalty = parseInt((xpNext - xpCurrent) / 10, 10);
    xpPenalty = Math.min(character.experience, xpPenalty);
  }

  character.experience -= parseInt(xpPenalty, 10);
  xpNeeded = xpNext ? parseInt(xpNext - character.experience, 10) : 0;

  var goldPenalty = character.gold;
  character.gold = parseInt(character.gold / 2, 10);
  goldPenalty -= character.gold;

  DQC.out(character.name + ': -' + xpPenalty + 'XP, ' + ' -' + goldPenalty + ' gold');

  return xpNeeded;
}

// Award experience to a character and check for level-up(s)
function updateExperience (DQC, character, amount) {
  var message;
  var growths;
  var level;
  var heart;

  amount = parseInt(amount, 10) || 0;

  character.experience += amount;
  level = checkLevel(DQC.data.experience, character.job, character.experience);
  while (character.level < level) {
    character.level++;
    message = 'Courage and wit hath served thee well, ' + character.name + '.';
    message += ' Thou hast been promoted to level ' + character.level + '!';
    
    growths = calculateStatGrowths(DQC, character);
    _.each(growths, function (value, key) {
      message += ' ' + key + ' + ' + value + ',';
    });
    message = message.replace(/,$/, '.');

    _.each(DQC.data.spell, function (spell) {
      if (spell.level === character.level && spell.learned[character.job]) {
        message += ' ' + character.name + ' hast learned ' + spell.name + '!';
      }
    });

    DQC.out(message);
    DQC.out();
  }

  // update monster heart experience
  if (character.heart.name) {
    character.heart.experience += (character.heart.experience >= 0) ? amount : 1;
    heart = _.findWhere(DQC.data.heart, { name : character.heart.name });
    while (heart && heart.can_transform && (heart.transform.experience <= character.heart.experience)) {
      message = character.name + "'s " + character.heart.name + ' heart starts shaking uncontrollably... ';
      message += character.heart.name + ' heart mutates into ' + heart.transform.name + ' heart! ';
      
      character.heart.name = heart.transform.name;
      heart = _.findWhere(DQC.data.heart, { name : heart.transform.name });
      message += (heart && heart.description) || '';

      DQC.out(message);
      DQC.out();
    }
  }
}
