var helpers   = require(process.cwd() + '/lib/helpers');
var Converter = require('csvtojson').core.Converter;
var nconf     = require('nconf');
var async     = require('async');
var fs        = require('fs');
var _         = require('lodash');

/*
 * Initialize 
 */
module.exports = function (next) {
  // PATH TO DATA FILES
  var path = nconf.get('data');
  if (path === '/lib/data/') {
    path = process.cwd() + path;
  }

  async.parallel({
    weapons     : data('weapons'),
    armor       : data('armor'),
    shields     : data('shields'),
    helmets     : data('helmets'),
    accessories : data('accessories'),
    experience  : dataArray('experience'),
    monsters    : data('monsters')
  }, next);

  function data (filename) {
    return function (callback) {
      var fileStream   = fs.createReadStream(path + filename + '.csv');
      var csvConverter = new Converter({});

      csvConverter.on('end_parsed', function (data) {
        return callback(null, data);
      });

      csvConverter.on('record_parsed', helpers.fixBoolean);

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
