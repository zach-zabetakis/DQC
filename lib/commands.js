var _ = require('lodash');

module.exports = {
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
  var dispName = member.name + (member.symbol || '');
  var message  = dispName + ' attacks!';

  return message;
}

// Move forward in the group ordering
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

// Parry incoming attacks
// The damage protection is applied at the start of the turn
function parry (DQC, scenario, member) {
  var dispName = member.name + (member.symbol || '');
  var message  = dispName + ' is on guard!';

  return message;
}

// Fall back in the group ordering
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
