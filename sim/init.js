var helpers   = require(__dirname + '/../lib/helpers');
var Converter = require('csvtojson').core.Converter;
var nconf     = require('nconf');
var async     = require('async');
var fs        = require('fs');
var _         = require('lodash');

/*
 * Initialize saved data from external data files.
 */
module.exports = function (rng, next) {
  // PATH TO DATA FILES
  var path = nconf.get('data');
  if (path === 'data') {
    path = __dirname + '/../' + path;
  }

  async.parallel({
    accessory     : data('accessory'),
    armor         : data('armor'),
    build_fighter : dataArray('build_fighter'),
    build_priest  : dataArray('build_priest'),
    build_ranger  : dataArray('build_ranger'),
    build_soldier : dataArray('build_soldier'),
    build_wizard  : dataArray('build_wizard'),
    character     : data('character'),
    command       : data('command'),
    experience    : dataArray('experience'),
    heart         : data('heart'),
    helmet        : data('helmet'),
    location      : data('location'),
    monster       : data('monster'),
    npc           : data('npc'),
    quest         : data('quest'),
    shield        : data('shield'),
    spell         : data('spell'),
    weapon        : data('weapon'),
    scenario      : loadScenario
  }, function (error, results) {
    if (results) {
      results.RNG = rng;
    }

    return next(error, results);
  });
  

  function data (filename) {
    return function (callback) {
      var csvConverter = new Converter({});
      var fileStream;

      csvConverter.on('record_parsed', helpers.fixData);
      csvConverter.on('end_parsed', function (data) {
        return callback(null, data);
      });

      try {
        fileStream = fs.createReadStream(path + '/' + filename + '.csv');
        fileStream.pipe(csvConverter);
      } catch (e) {
        return callback(new Error('Could not load data file: ' + filename));
      }
    }
  }

  function dataArray (filename) {
    return function (callback) {
      var csvConverter = new Converter({});
      var result       = {};

      csvConverter.on('end_parsed', function (data) {
        return callback(null, result);
      });
      csvConverter.on('record_parsed', function (resultRow, rawRow, rowIndex) {
        _.each(resultRow, function (value, key) {
          if (!result[key] || !result[key] instanceof Array) {
            result[key] = [];
          }
          result[key][rowIndex] = value;
        });
      });

      try {
        fileStream  = fs.createReadStream(path + '/' + filename + '.csv');
        fileStream.pipe(csvConverter);
      } catch (e) {
        return callback(new Error('Could not load data file: ' + filename));
      }
    }
  }

  function loadScenario (callback) {
    var scenario = nconf.get('scenario');
    var json;

    try {
      json = fs.readFileSync(path + '/scenario/' + scenario + '.json');
      json = JSON.parse(json);
    } catch (e) {
      return callback(new Error('Could not load scenario file'));
    }

    return callback(null, json);
  }
};
