#!/usr/bin/env node
/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var fs = require('fs')
    , args = require('./argparse').parse()
    , findBrowser = require('../has-browser').findBrowser
    , findPackage = require('../has-package').findPackage
    , params = []
    , moduleNames = []
    , pakmanager
    , action
    , cwd
    ;

  function isReady(env) {
    args.env = env;
    args.environment = env;
    console.log('env', env);

    pakmanager = require('../lib');

    function doAction() {
      var action = args.subcommand_name
        ;

      if (pakmanager[action]) {
        pakmanager[action](args, args, function () {
          console.log('pakmanager', arguments);
        });
      }
    }

    return doAction();
    //tryPackageJson();
  }

  console.log('parsed args:');
  console.log(typeof args);
  console.dir(args);
  /*
    {
        environment: 'guess',
        change_dir: '/path/to/dir',
        subcommand_name: 'build',
        env: null
    }
  */

  // TODO try to find root by rwalk
  cwd = args.change_dir || process.cwd();
  args.packageRoot = cwd;
  console.log(cwd);

  if (-1 !== ['browser', 'node'].indexOf(args.environment)) {
    isReady(args.environment);
    return;
  }

  findBrowser(function (type) {
    console.log('browser', type);
    if ('guess' !== type) {
      isReady(type);
      return;
    }

    findPackage(function (type1) {
      console.log('package', type1);
      if ('guess' !== type1) {
        isReady(type1);
      } else {
        isReady('browser');
      }
    });
  }, cwd);
}());
