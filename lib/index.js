(function () {
  "use strict";

  var pakman = require('pakman')
    , pakmanager = module.exports
    , fs = require('fs')
    , Future = require('future')
    , future = Future()
    , enderJs = __dirname + '/../vendor/ender-js/ender.js'
    , enderScript = fs.readFileSync(enderJs).toString('utf8')
    ;

  pakman.makePackageReady('./', function (err, pkg, missing, unlisted, unused, local, pm, builtin) {
    future.fulfill(err, pkg, missing, unlisted, unused, local, pm, builtin);

    if (err) {
      console.log(err);
      return;
    }

    if (missing.length) {
      console.error('[ERROR] The following packages are `require`d, but not in the package, nor on npm:');      missing.forEach(function (m) {
        console.warn('  ' + (m.modulepath || m.name));
      });   
    }     

    if (unlisted.length) {
      console.warn('[WARN] The following packages are `require`d, but not listed in package.json:');
      unlisted.forEach(function (m) {
        console.warn('  ' + (m.modulepath || m.name || m));
      });   
    }     

    if (unused.length) {
      console.warn('[WARN] The following packages are listed in package.json, but never `require`d:');
      unused.forEach(function (m) {
        console.warn('  ' + (m.modulepath || m.name || m));
      });   
    }     

  });

  function logDeps(err, pkg, missing, unlisted, unused, local, pm, builtin) {
    if (err) {
      console.error(err);
      return;
    }   

    if (local.length) {
      console.log('[INFO] The following packages are part of this package:');
      local.forEach(function (m) {
        console.log('  ' + (m.modulepath || m.name));
      });   
    }     

    if (pm.length) {
      console.log('[INFO] The following packages are needed by this package:');
      pm.forEach(function (m) {
        console.log('  ' + (m.modulepath || m.name));
      });   
    }     

    if (builtin.length) {
      console.log('[INFO] The following modules are provided natively by the environment:');
      builtin.forEach(function (m) {
        console.log('  ' + (m.modulepath || m.name));
      });   
    }     
  }

  function templateModule(module) {
    var newScript
      ;   

    // module.providespath is added by normalizeScriptRequires
    // TODO move to where?

    if (!module) {
      console.error('missing module', module);
      return;
    }   

    if (!module.scriptSource) {
      console.error('missing script source', module);
      return;
    }   
  
    // I'm using the 'ender:' prefix to make it
    // easier to search for a module start
    newScript = ''
      + '\n// ender:' + module.modulepath + ' as ' + module.providespath
      + '\n(function (context) {' 
      //+ '\n  "use strict";' 
      + '\n  '
      + '\n  var module = { exports: {} }, exports = module.exports'
      + '\n    , $ = require("ender")'
      + '\n    ;'
      + '\n  '
      + '\n  '
      + '\n  ' + module.scriptSource.replace(/\n/g, '\n  ')
      + '\n'
      + '\n  provide("' + module.providespath + '", module.exports);'
      + '\n  $.ender(module.exports);'
      + '\n}(global));'
      ;   

    return newScript;
  }

  pakmanager.deps = function (params, args, fn) {
    future.when(logDeps);
  };

  pakmanager.init = function (params, args, fn) {
    pakman.getPackageInfo('./', function (err, pkg) {
      if (err) {
        console.error('Could not parse `package.json`');
        console.warn('Please run `npm init`. See https://github.com/coolaj86/node-pakman/example/README.md');
        console.warn('If package.json exists then `npm install -g validate-json` and `validate-json package.json`');
        return;
      }

      console.log('Not Implemented');
    });
  };

  pakmanager.build = function () {
    pakman.compile('./', templateModule, function (err, compiled) {
      fs.writeFile('./pakmanaged.js', ''
        //+ '(function () {\n'
        + 'var global = Function("return this;")()\n'
        + enderScript 
        + compiled
        //+ '}());\n'
      , 'utf8');
      fs.writeFile('./pakmanaged.html', ''
        +   '<html>'
        + '\n<head><script src="pakmanaged.js"></script></head>'
        + '\n<head><script src="pakmanaged-test.js"></script></head>'
        + '\n<body>' 
        + '\n  Open your debug console and check for errors'
        + '\n  <br/>'
        + '\n  You might also want to throw some tests into pakmanaged-test.js'
        + '\n</body>'
        + '\n</html>'
      , 'utf8');
      console.warn('[WARN] iHeartTheBadParts (non-strict mode) on by default\n');
      console.log('wrote pakmanaged.js and pakmanaged.html');
    });
  };
}());
