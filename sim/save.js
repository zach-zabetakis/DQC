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
  var scenario = nconf.get('scenario');
  var path     = nconf.get('data');

  if (path === 'data') {
    path = __dirname + '/../' + path;
  }

  async.parallel([
    writeCharacterData(DQC.data.character),
    writeRecruitData(DQC.data.recruit),
    writeScenarioData(DQC.scenario)
  ], function (error, results) {
    if (error) { throw new Error(error); }

    return next();
  });

  function writeCharacterData (characters) {
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
        function validate (key, type) {
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
        var charFileTest  = path + '/character-test.csv';

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

  function writeRecruitData (recruits) {
    return function (callback) {
      var input = [];

      // add header row, which must match columns from CSV file (and row ordering below) exactly
      input.push([
        'name', 'species', 'owner', 'status', 'curr_HP', 'curr_MP'
      ]);

      _.each(recruits, function (recruit) {
        // perform simple validate and ensure data is in a format that will easily convert to readable CSV results.
        function validate (key, type) {
          var value = _.findValue(recruit, key);
          switch (type) {
            case 'bool':
              return value ? true : false;
              break;
            case 'int':
              value = parseInt(value || 0, 10);
              if (_.isNaN(value) || value < 0) {
                return callback('Possible data error detected. Recruit ' + recruit.name + ' has ' + key + ' value of ' + recruit[key]);
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
          validate('name', 'string'),
          validate('species', 'string'),
          validate('owner', 'string'),
          recruit.status.join(';'),
          validate('curr_HP', 'int'),
          validate('curr_MP', 'int')
        ];

        input.push(row);
      });

      // Generate CSV output, save previous version of recruit data file, then write new recruit data.
      csv(input, { quotedEmpty : false, quotedString : true }, function (err, output) {
        if (err) { return callback('Failed to generate CSV from recruit data.'); }

        var recruitFile     = path + '/recruit.csv';
        var recruitFilePrev = path + '/recruit-prev.csv';
        var recruitFileTest = path + '/recruit-test.csv';

        fs.rename(recruitFile, recruitFilePrev, function (err) {
          if (err) { return callback('Failed to rename previous recruit file.'); }

          fs.writeFile(recruitFile, output, function (err) {
            if (err) { return callback('Failed to write recruit data to output file.'); }

            return callback();
          });
        });
      });
    };
  }

  function writeScenarioData (data) {
    data = _.cloneDeep(data);

    // iterator function for returning essential member data
    function cleanMemberData (essential) {
      return function (member) {
        var saved = {};

        _.each(essential, function (key) {
          if (typeof member[key] !== 'undefined') {
            saved[key] = member[key];
          }
        });

        return saved;
      }
    }

    // iterator function for returning essential group data
    function cleanGroupData (essential) {
      return function (group) {
        var saved_group = {};

        saved_group.front   = group.front || null;
        saved_group.members = _.map(group.members, cleanMemberData(essential));

        return saved_group;
      }
    }

    return function (callback) {
      var essential = {
        characters : [
          'name',
          'can_act',
          'can_target',
          'recruit'
        ],
        allies : [
          'type',
          'name',
          'species',
          'curr_HP',
          'curr_MP',
          'status',
          'effects',
          'can_act',
          'can_target',
          'position'
        ],
        battle : {
          characters : [
            'name'
          ],
          allies : [
            'type',
            'name'
          ],
          enemies : [
            'type',
            'name',
            'symbol',
            'curr_HP',
            'curr_MP',
            'status',
            'effects',
            'can_act',
            'can_target',
            'can_cast',
            'position',
            'defeated_by'
          ]
        }
      };

      _.each(data.scenarios, function (scenario) {
        scenario.characters = _.map(scenario.characters, cleanMemberData(essential.characters));
        scenario.allies     = _.map(scenario.allies, cleanMemberData(essential.allies));
        scenario.battle.characters.groups = _.map(scenario.battle.characters.groups, cleanGroupData(essential.battle.characters));
        scenario.battle.allies.groups     = _.map(scenario.battle.allies.groups, cleanGroupData(essential.battle.allies));
        scenario.battle.enemies.groups    = _.map(scenario.battle.enemies.groups, cleanGroupData(essential.battle.enemies));
      });

      var output           = JSON.stringify(data, null, 2);
      var scenarioFile     = path + '/scenario/' + scenario + '.json';
      var scenarioFilePrev = path + '/scenario/' + scenario + '-prev.json';
      var scenarioFileTest = path + '/scenario/' + scenario + '-test.json';
      
      fs.rename(scenarioFile, scenarioFilePrev, function (err) {
        if (err) { return callback('Failed to rename previous scenario file.'); }

        fs.writeFile(scenarioFile, output, function (err) {
          if (err) { return callback('Failed to write scenario data to output file.'); }

          return callback();
        });
      });
    };
  }
};
