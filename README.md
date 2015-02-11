# apostrophe-query-cache

This *experimental* module adds a simple MongoDB query cache to an [Apostrophe site](http://apostrophenow.org). The cache is applied to all calls to `apos.get`, which means it impacts just about all content displayed by Apostrophe.

The entire cache is invalided by any call to any method of the `pages` collection that makes a modification. This makes the cache reasonably safe, provided that you *do not use it on multicore or multi-server sites*.

This cache makes sense only if your site has become database-bound, spending most of its time waiting for MongoDB rather than doing work of its own.

## Installation

npm install --save apostrophe-query-cache

## Configuration

```javascript
'apostrophe-query-cache': {}
```

## Memory management

Since there is no active management of how much memory the cache is using, it is automatically invalidated every 60 seconds. In most cases this is enough to keep memory usage reasonable. It is also a very crude solution; some sort of Least Recently Used strategy would be much nicer.

## Overrides

You can subclass this module at the project level to change the rules for invalidating the cache. The default is that any write to the pages collection will invalidate the cache. You can change this by overriding the `invalidate` method, which receives the method name called (such as `update`), and an array containing the arguments to that method. Return `true` to invalidate the cache, `false` to leave it alone.

This example ignores any update calls that increment something with `$inc`. We found this handy on a site that incremented a page access counter on every view but didn't need to show that information instantly to the public.

```javascript
module.exports = cache;

function cache(options, callback) {
  return new cache.Construct(options, callback);
}

cache.Construct = function(options, callback) {

  var self = this;

  module.exports.Super.call(self, options, null);

  self.invalidate = function(method, args) {
    if (method === 'update') {
      var action = args[1];
      if (action && action.$inc) {
        return false;
      }
    }
    return true;
  };

  return process.nextTick(callback);
};
```

## Stability and Compatibility

This module is compatible with Apostrophe 0.4 and 0.5. It is currently experimental but we are using it in production.
