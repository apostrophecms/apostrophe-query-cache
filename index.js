var util = require('util');
var async = require('async');
var _ = require('lodash');

module.exports = cache;

function cache(options, callback) {
  return new cache.Construct(options, callback);
}

cache.Construct = function(options, callback) {

  var self = this;

  self._pages = options.pages;
  self._apos = options.apos;
  self._app = options.app;

  var cache = {};

  // Brute force memory management
  setInterval(function() {
    cache = {};
  }, 60000);

  self.invalidate = function(method/* , original arguments */) {
    return true;
  };

  var superGetBackend = self._apos.getBackend;
  self._apos.getBackend = function(criteria, projection, skip, limit, sort, callback) {
    // Use util.inspect because it understands what to do with Date and RegExp,
    // JSON.stringify does not
    var key = util.inspect({ criteria: criteria, projection: projection, skip: skip, limit: limit, sort: sort }, { depth: 10 });
    if (_.has(cache, key)) {
      return setImmediate(_.partial(callback, null, _.cloneDeep(cache[key])));
    }
    return superGetBackend(criteria, projection, skip, limit, sort, function(err, answer) {
      cache[key] = answer;
      return callback(null, _.cloneDeep(answer));
    });
  };

  var wrap = [ 'insert', 'remove', 'rename', 'update', 'drop', 'findAndModify', 'findAndRemove' ];

  _.each(wrap, function(method) {
    var superMethod = self._apos.pages[method];
    self._apos.pages[method] = function() {
      // Invalidate the cache
      if (self.invalidate(method, Array.prototype.slice.call(arguments))) {
        cache = {};
      }
      return superMethod.apply(self._apos.pages, arguments);
    };
  });

  if (callback) {
    // Must invoke callback on nextTick
    return process.nextTick(function() {
      return callback(null);
    });
  }
};
