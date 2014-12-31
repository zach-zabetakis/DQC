var _ = require('lodash');

module.exports = {
  fixData : fixData
};

// recursively iterates over an object, fixing data imported from a csv file.
// compacts arrays and changes string values to use boolean equivalents.
// currently fixes strings of 'TRUE' or 'FALSE' (case insensitive)
function fixData (result) {
  _.each(result, function (value, key) {
    if (value instanceof Array) {
      result[key] = _.compact(value);
    } else if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') {
        result[key] = true;
      } else if (value.toLowerCase() === 'false') {
        result[key] = false;
      }
    } else if (typeof value === 'object') {
      fixData(value);
    } 
  });
}
