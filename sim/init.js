var Converter = require('csvtojson').core.Converter;
var async     = require('async');
var fs        = require('fs');

// PATH TO DATA FILES
var PATH = process.cwd() + '/lib/data/';

/*
 * Initialize 
 */
module.exports = function (next) {
  async.parallel({
    weapons : data('weapons'),
    armor   : data('armor'),
    shields : data('shields'),
    helmets : data('helmets')
  }, next);

  function data (filename) {
    return function (callback) {
      var fileStream   = fs.createReadStream(PATH + filename + '.csv');
      var csvConverter = new Converter({});

      csvConverter.on('end_parsed', function (data) {
        return callback(null, data);
      });

      fileStream.pipe(csvConverter);
    }
  }
};
