#!/usr/bin/env node
(function () {
  "use strict";

  var fs = require('fs')
    , pakmanager = require('pakmanager')
    , args = process.argv.slice(2)
    , action = args.shift()
    , possibleAction
    , params = []
    , moduleNames = []
    , actions = {
          'help': 'help'
        , 'h': 'help'
        , 'build': 'build'
        , 'init': 'init'
        , 'b': 'add'
        , 'c': 'add'
        , 'deps': 'deps'
        , 'add': 'add'
        , 'a': 'add'
        , 'remove': 'remove'
        , 'rm': 'remove'
        , 'r': 'remove'
        , 'info': 'list'
        , 'list': 'list'
        , 'ls': 'list'
        , 'u': 'update'
        , 'up': 'update'
        , 'update': 'update'
        , 'l': 'list'
        , 'refresh': 'refresh'
      }
    ;

  function sortArgs() {
    possibleAction = (action||'').replace(/^-{1,2}/, '');
    if (!actions[possibleAction]) {
      if (action) {
        // we'll assume 'add' later an
        args.unshift(action);
        action = undefined;
      }
    }

    args.forEach(function (arg) {
      if (/^-{1,2}/.exec(arg)) {
        params.push(arg.replace(/^-{1,2}/, ''));
        return;
      }

      moduleNames.push(arg);
    });
  }

  function tryPackageJson() {
    fs.readFile('./package.json', function (err, data) {
      var pkgModules
        , pkgJson
        ;

      try {
        pkgJson = data && JSON.parse(data.toString('utf8')) || {};
      } catch(e) {
        console.log('package.json:', e);
        return;
      }

      pkgModules = (pkgJson.ender && pkgJson.ender.dependencies) || pkgJson.enderDependencies || pkgJson.dependencies || {};

      if (Array.isArray(pkgModules)) {
        moduleNames = pkgModules.concat(moduleNames);
        pkgModules = {};
      }

      moduleNames = Object.keys(pkgModules).concat(moduleNames);

      moduleNames.forEach(function (name, i) {
        var semver = /\s*(=|>=|<=|~)\s*v?(\d+)(?:\.(\d+))?(?:\.(\d+))?\s*/.exec(pkgModules[name])
          ;

        //pkgModules[name] = pkgModules[name] || ">= 0.0.0"

        if (semver && '=' === semver[1]) {
          moduleNames[i] = name + '@' + semver[2] + '.' + semver[3] + '.' + semver[4];
        }
      });

      if (moduleNames.length) {
        doAction();
        return;
      }

      if (err) {
        console.error('Could not read package.json no modules were specified to add\n');
      }

      action = 'help';
      doAction();
    });
  }

  function doAction() {
    if (!action && params.length) {
      action = 'help';
    }

    action = (action||'').replace(/^-{1,2}/, '');

    if (moduleNames.length) {
      action = action || 'add';
    }

    action = actions[action] || 'help';

    if ('help' === action) {
      console.log('Usage: mend < add | list | update | remove > moduleName0 [, moduleName1, ...]');
      console.log('Example: mend add jeesh ahr2 futures');
      console.log('');
      return;
    }

    // takeAction
    pakmanager[action] && pakmanager[action](params, moduleNames, function () {
      console.log('pakmanager', arguments);
    });
  }

  // this is where we should get serious
  function takeAction(action, params, moduleNames) {
    console.log('takeAction', action, params, moduleNames);
  }

  /*
  mend --build jeesh jQuery ahr2 -stupid reqwest futures  -g --build
  --> add [ 'stupid', 'g', 'build' ] [ 'jeesh', 'jQuery', 'ahr2', 'reqwest', 'futures' ]
  mend
  mend --foo -bar
  --> [help message is displayed]
  */

  sortArgs();
  return doAction();
  tryPackageJson();
}());
