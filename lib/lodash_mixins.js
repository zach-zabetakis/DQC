var _ = require('lodash');

module.exports = _;

var mixins = {
  findValue : function (obj, namespace, defaultValue) {
    if (!obj) { return defaultValue }

    var keys = namespace.split('.').reverse();

    while (keys.length && (obj = obj[keys.pop()]) !== undefined) { /* Empty */ }

    return (typeof obj !== 'undefined' ? obj : defaultValue);
  }
}

_.mixin(mixins);
