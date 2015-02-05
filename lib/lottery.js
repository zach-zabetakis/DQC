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
function ballOfLight (RNG) {
  var numbers = [];
  var message = 'BALL OF LIGHT: The winning numbers are...';
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
function loto3 (RNG) {
  var message = 'LOTO 3: The winning numbers are...';

  for (var i = 0; i < 3; i++) {
    message += ' ' + RNG.integer(0, 9) + '!';
  }

  helpers.out(message);
}
