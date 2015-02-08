var _       = require('lodash');
var helpers = require(process.cwd() + '/lib/helpers');

module.exports = {
  bol   : ballOfLight,
  loto3 : loto3,
};

// Ball of Light lottery game
// 
// Select four numbers from 1 through 25.
// Repeat numbers are not allowed, but order is unimportant.
// Then, select one number from 1 through 16 (the "Ball of Light")
function ballOfLight (RNG, characters) {
  var message = 'BALL OF LIGHT: The winning numbers are...';
  var numbers = [];
  var number;

  for (var i =0; i < 4; i++) {
    number = RNG.integer(1, 25);
    if (!_.contains(numbers, number)) {
      numbers.push(number);
    }
  }

  message += ' ' + numbers.join('! ');
  message += ' And the Ball of Light... ' + RNG.integer(1, 16) + '!';

  helpers.out(message);
}

// Loto 3 lottery game
//
// Select three numbers from 0 through 9.
// Repeat numbers are allowed, and order is unimportant.
function loto3 (RNG, characters) {
  var numbers  = [];
  var expires  = [];
  var messages = [];

  // generate lucky numbers!
  for (var i = 0; i < 3; i++) {
    numbers.push(RNG.integer(0, 9));
  }

  messages.push('LOTO 3: The winning numbers are... ' + numbers.join('! ') + '!');

  // check for winning tickets
  _.each(characters, function (character) {
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
        messages.push('WINNER! ' + character.name + ': Grand Prize! +500 gold!');
        character.gold += 500;
      } else if (matches === 2) {
        // second prize -- 40G
        messages.push('WINNER! ' + character.name + ': Second Prize! +40 gold!');
        character.gold += 40;
      }
    });

    if (character.loto3.length) {
      expires.push(character.name);
      character.loto3 = [];
    }
  });

  // only show lottery results if there are expiring tickets
  if (expires.length) {
    _.each(messages, helpers.out);
    helpers.out('[Expiring tickets: ' + expires.join(', ') + ']', false, true);
  }
}
