var _       = require('lodash');

module.exports = {
  chooseCommand : chooseCommand
};

// choose a command based on all available factors
function chooseCommand (DQC, scenario, member, front) {
  var random1 = [125, 125, 125, 125, 125, 125, 125, 125];
  var random2 = [220, 200, 180, 160, 90, 70, 50, 30];
  var random3 = _.clone(random2).reverse();
  var number  = DQC.RNG.integer(1, 1000);

  switch (member.behavior) {
    case 'custom':
      // run custom AI function based on name
      break;
    case 'fixed':
      // loop through pattern array sequentially
      break;
    case 'random1':
      // each move has an equal chance to be picked
      break;
    case 'random2':
      // pattern array is weighted from more to less likely
      break;
    case 'random3':
      // patern array is weighted, but is reversed if HP is low
      break;
    case 'none':
    default:
      // exit out of function without choosing a command
      break;
  }
}
