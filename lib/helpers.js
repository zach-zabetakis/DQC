var _ = require('lodash');

module.exports = {
  fixBoolean : fixBoolean
};

// recursively iterates over an object, fixing string values to use boolean equivalents
// currently fixes strings of 'TRUE' or 'FALSE' (case insensitive)
function fixBoolean (result) {
  _.each(result, function (value, key) {
    if (typeof value === 'object') {
      fixBoolean(value);
    } else if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') {
        result[key] = true;
      } else if (value.toLowerCase() === 'false') {
        result[key] = false;
      }
    }
  });
}
