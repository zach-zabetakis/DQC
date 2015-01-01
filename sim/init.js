var helpers   = require(process.cwd() + '/lib/helpers');
var Converter = require('csvtojson').core.Converter;
var nconf     = require('nconf');
var async     = require('async');
var fs        = require('fs');
var _         = require('lodash');

/*
 * Initialize saved data from external data files.
 */
module.exports = function (next) {
  // PATH TO DATA FILES
  var path = nconf.get('data');
  if (path === '/lib/data/') {
    path = process.cwd() + path;
  }

  async.parallel({
    weapon     : data('weapon'),
    armor      : data('armor'),
    shield     : data('shield'),
    helmet     : data('helmet'),
    accessory  : data('accessory'),
    heart      : data('heart'),
    experience : dataArray('experience'),
    monster    : data('monster'),
    character  : data('character')
  }, next);
  

  function data (filename) {
    return function (callback) {
      var fileStream   = fs.createReadStream(path + filename + '.csv');
      var csvConverter = new Converter({});

      csvConverter.on('end_parsed', function (data) {
        return callback(null, data);
      });

      csvConverter.on('record_parsed', helpers.fixData);

      fileStream.pipe(csvConverter);
    }
  }

  function dataArray (filename) {
    return function (callback) {
      var fileStream   = fs.createReadStream(path + filename + '.csv');
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

      fileStream.pipe(csvConverter);
    }
  }
};
