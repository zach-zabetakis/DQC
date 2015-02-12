var _       = require('lodash');
var helpers = require(__dirname + '/helpers');

module.exports = {
  bol   : ballOfLight,
  loto3 : loto3,
};

// Ball of Light lottery game
// 
// Select four numbers from 1 through 25.
// Repeat numbers are not allowed, but order is unimportant.
// Then, select one number from 1 through 16 (the "Ball of Light")
function ballOfLight (DQC) {
  var numbers  = [];
  var messages = [];
  var expires  = [];
  var number;

  // generate lucky numbers!
  for (var i =0; i < 4; i++) {
    number = DQC.RNG.integer(1, 25);
    if (!_.contains(numbers, number)) {
      numbers.push(number);
    }
  }
  // Ball of Light
  number = DQC.RNG.integer(1, 16);

  messages.push(helpers.format('BALL OF LIGHT:', true) + ' The winning numbers are... '
   + numbers.join('! ') + '! And the Ball of Light... ' + number + '!');

  // check for winning tickets
  _.each(DQC.data.character, function (character) {
    _.each(character.bol, function (ticket) {
      ticket = ticket.split('/');
      var test    = _.map(ticket[0].split(','), function (num) { return parseInt(num, 10); });
      var bol     = parseInt(ticket[1], 10);
      var matches = 0;
      var num1, index;

      for (var i = 0; i < numbers.length; i++) {
        num1  = numbers[i];
        index = _.findIndex(test, function (num2) { return num1 === num2; });
        if (index > -1) {
          matches++;
          delete test[index];
          continue;
        }
      }

      ticket = ticket.join('/');
      if (matches === 4 && bol === number) {
        // grand prize -- 50000G + jackpot
        messages.push('WINNER! ' + character.name + ': Jackpot! +' + DQC.scenario.jackpot + ' gold! (' + ticket + ')');
        character.gold += DQC.scenario.jackpot;
        DQC.scenario.jackpot = 50000;
      } else if (matches === 4) {
        // first prize -- 5000G
        messages.push('WINNER! ' + character.name + ': First Prize! +5000 gold! (' + ticket + ')');
        character.gold += 5000;
      } else if (matches === 3 && bol === number) {
        // second prize -- 2500G
        messages.push('WINNER! ' + character.name + ': Second Prize! +2500 gold! (' + ticket + ')');
        character.gold += 2500;
      } else if (matches === 3 || (matches === 2 && bol === number)) {
        // third prize -- 500G
        messages.push('WINNER! ' + character.name + ': Third Prize! +500 gold! (' + ticket + ')');
        character.gold += 500;
      } else if (matches === 2 || (matches === 1 && bol === number)) {
        // fourth prize -- 100G
        messages.push('WINNER! ' + character.name + ': Fourth Prize! +100 gold! (' + ticket + ')');
        character.gold += 100;
      } else if (bol === number) {
        // fifth prize -- 50G
        messages.push('WINNER! ' + character.name + ': Fifth Prize! +50 gold! (' + ticket + ')');
        character.gold += 50;
      }
    });

    if (character.bol.length) {
      expires.push(character.name);
      character.bol = [];
    }
  });

  if (expires.length) {
    messages.push(helpers.format('[Expiring tickets: ' + expires.join(', ') + ']', false, true));
    return messages;
  } else {
    return [];
  }
}

// Loto 3 lottery game
//
// Select three numbers from 0 through 9.
// Repeat numbers are allowed, and order is unimportant.
function loto3 (DQC) {
  var numbers  = [];
  var messages = [];
  var expires  = [];

  // generate lucky numbers!
  for (var i = 0; i < 3; i++) {
    numbers.push(DQC.RNG.integer(0, 9));
  }

  messages.push(helpers.format('LOTO 3:', true) + ' The winning numbers are... ' + numbers.join('! ') + '!');

  // check for winning tickets
  _.each(DQC.data.character, function (character) {
    _.each(character.loto3, function (ticket) {
      var test    = _.map(ticket.split(''), function (num) { return parseInt(num, 10); });
      var matches = 0;
      var num1, index;

      for (var i = 0; i < numbers.length; i++) {
        num1  = numbers[i];
        index = _.findIndex(test, function (num2) { return num1 === num2; });
        if (index > -1) {
          matches++;
          delete test[index];
          continue;
        }
      }

      if (matches === 3) {
        // grand prize -- 500G
        messages.push('WINNER! ' + character.name + ': First Prize! +500 gold! (' + ticket + ')');
        character.gold += 500;
      } else if (matches === 2) {
        // second prize -- 40G
        messages.push('WINNER! ' + character.name + ': Second Prize! +40 gold! (' + ticket + ')');
        character.gold += 40;
      }
    });

    if (character.loto3.length) {
      expires.push(character.name);
      character.loto3 = [];
    }
  });

  // only return lottery results if there are expiring tickets
  if (expires.length) {
    messages.push(helpers.format('[Expiring tickets: ' + expires.join(', ') + ']', false, true));
    return messages;
  } else {
    return [];
  }
}
