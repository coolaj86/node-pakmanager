/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var oldRequire = global.require
    , modules = {}
    ;

  function newRequire(modulename) {
    var err
      , mod
      , metamod
      ;

    try {
      mod = oldRequire(modulename);
    } catch(e) {
      err = e;
    }

    if (mod) {
      return mod;
    }

    metamod = modules[modulename];
    
    if (metamod) {
      mod = metamod();
      return mod;
    }

    // make it possible to require 'process', etc
    mod = global[modulename];

    if (mod) {
      return mod;
    }

    throw err;
  }

  function provide(modulename, factory) {
    var modReal
      ;

    function metamod() {
      if (!modReal) {
        if (factory.__pakmanager_factory__) {
          modReal = factory();
        } else {
          modReal = factory;
        }
      }

      return modReal;
    }

    modules[modulename] = metamod;
    // somewhat of a dirty hack since I don't have a plug for loading the "main" module otherwise
    modules['pakmanager.main'] = metamod;
  }

  require = newRequire;
  global.require = newRequire;
  global.provide = provide;
}());
