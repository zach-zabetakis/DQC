var async = require('async');
var nconf = require('nconf');
var csv   = require('csv-stringify');
var fs    = require('fs');
var _     = require('lodash');

/*
 * Save results of the update to the appropriate file(s)
 */
module.exports = function (DQC, next) {
  // PATH TO DATA FILES
  var path = nconf.get('data');
  if (path === 'data') {
    path = __dirname + '/../' + path;
  }

  async.parallel([
    //writeCharacterData(DQC.data.character),
    writeScenarioData(DQC.scenario)
  ], function (error, results) {
    if (error) { throw new Error(error); }

    return next();
  });

  function writeCharacterData(characters) {
    return function (callback) {
      var input = [];

      // add header row, which must match columns from CSV file (and row ordering below) exactly
      input.push([
        'player', 'name', 'build', 'job', 'level', 'experience', 'gold', 'status', 'effects', 'abilities',
        'curr_HP', 'curr_MP', 'base_HP', 'base_MP', 'base_strength', 'base_agility', 'attack', 'defense', 'base_miss', 'base_critical', 'base_dodge',
        'resist.burn', 'resist.beat', 'resist.numb', 'resist.poison', 'resist.sap', 'resist.slow',
        'resist.chaos', 'resist.robmagic', 'resist.sleep', 'resist.stopspell', 'resist.surround', 'resist.fear',
        'equip.weapon', 'equip.armor', 'equip.shield', 'equip.helmet', 'heart.name', 'heart.experience',
        'inventory[0]', 'inventory[1]', 'inventory[2]', 'inventory[3]', 'inventory[4]', 'inventory[5]', 'has_bag', 'bag[0]', 'bag[1]', 'bag[2]', 'bag[3]',
        'loto3[0]', 'loto3[1]', 'loto3[2]', 'loto3[3]', 'bol[0]', 'bol[1]', 'bol[2]', 'bol[3]', 'deaths', 'active'
      ]);

      _.each(characters, function (character) {
        // perform simple validation and ensure data is in a format that will easily convert to readable CSV results.
        function validate(key, type) {
          var value = _.findValue(character, key);
          switch (type) {
            case 'bool':
              return value ? true : false;
              break;
            case 'int':
              value = parseInt(value || 0, 10);
              if (_.isNaN(value) || value < 0) {
                return callback('Possible data error detected. Character ' + character.displayName() + ' has ' + key + ' value of ' + character[key]);
              }
              return value;
              break;
            case 'string':
              return value || '';
              break;
            default:
              return value;
              break;
          }
        }

        var row = [
          validate('player', 'string'),
          validate('name', 'string'),
          validate('build', 'int'),
          validate('job', 'string'),
          validate('level', 'int'),
          validate('experience', 'int'),
          validate('gold', 'int'),
          character.status.join(';'),
          character.effects.join(';'),
          character.abilities.join(';'),
          validate('curr_HP', 'int'),
          validate('curr_MP', 'int'),
          validate('base_HP', 'int'),
          validate('base_MP', 'int'),
          validate('base_strength', 'int'),
          validate('base_agility', 'int'),
          validate('attack', 'int'),
          validate('defense', 'int'),
          validate('base_miss', 'int'),
          validate('base_critical', 'int'),
          validate('base_dodge', 'int'),
          validate('resist.burn', 'int'),
          validate('resist.beat', 'int'),
          validate('resist.numb', 'int'),
          validate('resist.poison', 'int'),
          validate('resist.sap', 'int'),
          validate('resist.slow', 'int'),
          validate('resist.chaos', 'int'),
          validate('resist.robmagic', 'int'),
          validate('resist.sleep', 'int'),
          validate('resist.stopspell', 'int'),
          validate('resist.surround', 'int'),
          validate('resist.fear', 'int'),
          validate('equip.weapon', 'string'),
          validate('equip.armor', 'string'),
          validate('equip.shield', 'string'),
          validate('equip.helmet', 'string'),
          validate('heart.name', 'string'),
          validate('heart.experience', 'int'),
          validate('inventory.0', 'string'),
          validate('inventory.1', 'string'),
          validate('inventory.2', 'string'),
          validate('inventory.3', 'string'),
          validate('inventory.4', 'string'),
          validate('inventory.5', 'string'),
          validate('has_bag', 'bool'),
          validate('bag.0', 'string'),
          validate('bag.1', 'string'),
          validate('bag.2', 'string'),
          validate('bag.3', 'string'),
          validate('loto3.0', 'string'),
          validate('loto3.1', 'string'),
          validate('loto3.2', 'string'),
          validate('loto3.3', 'string'),
          validate('bol.0', 'string'),
          validate('bol.1', 'string'),
          validate('bol.2', 'string'),
          validate('bol.3', 'string'),
          validate('deaths', 'int'),
          validate('active', 'bool')
        ];

        input.push(row);
      });

      // Generate CSV output, save previous version of character data file, then write new character data.
      csv(input, { quotedEmpty : false, quotedString : true }, function (err, output) {
        if (err) { return callback('Failed to generate CSV from character data.'); }

        var characterFile = path + '/character.csv';
        var charFilePrev  = path + '/character-prev.csv';

        fs.rename(characterFile, charFilePrev, function (err) {
          if (err) { return callback('Failed to rename previous character file.'); }

          fs.writeFile(characterFile, output, function (err) {
            if (err) { return callback('Failed to write character data to output file.'); }

            return callback();
          })
        });
      });
    };
  }

  function writeScenarioData(data) {
    data = _.cloneDeep(data);
    return function (callback) {
      _.each(data.scenarios, function (scenario) {
        scenario.characters = _.map(scenario.characters, function (character) {
          var saved     = {};
          var essential = [
            'name'
          ];
          
          // remove all nonessential data
          _.each(essential, function (key) {
            saved[key] = character[key];
          });

          return saved;
        });
        scenario.allies = _.map(scenario.allies, function (ally) {
          var saved     = {};
          var essential = [
            'type',
            'name',
            'curr_HP',
            'curr_MP',
            'status',
            'effects',
            'can_target',
            'can_act'
          ];

          // remove all nonessential data
          _.each(essential, function (key) {
            saved[key] = ally[key];
          });

          return saved;
        });

        // TODO: clean up battle data        
      });

      
      // TODO: Save scenario data to an external file
      return callback();
    };
  }
};
