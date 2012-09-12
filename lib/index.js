/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true*/
(function () {
  "use strict";

  var pakmanager = module.exports
    , pakman = require('../../node-pakman')
    //, pakman = require('pakman')
    , fs = require('fs')
    , path = require('path')
    , Future = require('future')
    , future = Future.create()
    , nodeNatives = require('./node-natives.js')
    , browserNatives = require('./browser-natives.js')
    ;

  function arrRemove(arr, from, to) {
    var rest = arr.slice((to || from) + 1 || arr.length);
    arr.length = from < 0 ? arr.length + from : from;
    return arr.push.apply(arr, rest);
  }

  function displayResults(err, pkg, missing, unlisted, unused, local, pm, builtin) {
    future.fulfill(err, pkg, missing, unlisted, unused, local, pm, builtin);

    if (err) {
      console.log(err);
      return;
    }

    if (missing.length) {
      console.error('[ERROR] The following packages are `require`d, but not in the package, nor on npm:');
      missing.forEach(function (m) {
        console.warn('  ' + (m.modulepath || m.name));
      });   
    }     

    unlisted.forEach(function (name, i) {
      if ('ender' === name) {
        arrRemove(unused, i);
      }
    });
    if (unlisted.length) {
      console.warn('[WARN] The following packages are `require`d, but not listed in package.json:');
      unlisted.forEach(function (m) {
        console.warn('  ' + (m.modulepath || m.name || m));
      });   
    }     

    // TODO determine by pkg.ender pkg.keywords.ender
    unused.forEach(function (name, i) {
      if (-1 !== ['jeesh', 'bonzo', 'bean', 'qwery'].indexOf(name)) {
        arrRemove(unused, i);
      }
    });
    if (unused.length) {
      console.warn('[WARN] The following packages are listed in package.json, but never `require`d:');
      unused.forEach(function (m) {
        console.warn('  ' + (m.modulepath || m.name || m));
      });   
    }     

  }

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

  pakmanager.deps = function (params, args, fn) {
    future.when(logDeps);
  };

  pakmanager.build = function (args, args1) {
    var builtIns
      // ls ~/Code/node/lib/ | grep '' | cut -d'.' -f1 | while read M; do echo , \"${M}\"; done
      , loaderJs
      , loaderScript
        // TODO allow compiling outside of cwd
      , packageRoot = process.cwd()
      ;

    if ('browser' === args.environment) {
      loaderJs = path.join(__dirname, '..', 'vendor', 'ender-js', 'ender.js');
    } else {
      loaderJs = path.join(__dirname, '.', 'pakmanager-loader.js');
    }
    loaderScript = fs.readFileSync(loaderJs, 'utf8');

    function templateModule(module, pkg) {
      var newScript = ''
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
    
      // I'm using the 'pakmanager:' prefix to make it
      // easier to search for a module start
      // TODO use AMD-style define 
      newScript += ''
        + '\n// pakmanager:' + module.modulepath
        ;

      if (module.modulepath !== module.providespath) {
      newScript += ''
        + ' as ' + module.providespath
        ;
      }

      newScript += ''
        + '\n(function (context) {' 
        ;

      if ('node' === args.environment) {
      newScript += ''
        + '\n  function factory() {'
        ;
      }

      newScript += ''
        //+ '\n  "use strict";' 
        + '\n  '
        + '\n  var module = { exports: {} }, exports = module.exports'
        ;

      if ('browser' === args.environment) {
        newScript += ''
          + '\n    , $ = require("ender")'
          ;
      }

      newScript += ''
        + '\n    ;'
        + '\n  '
        ;

      newScript += ''
        + '\n  ' + module.scriptSource.replace(/\n/g, '\n    ')
        ;

      if ('node' === args.environment) {
      newScript += ''
        + '\n    return module.exports;'
        + '\n  }'
        ;
      }
      
      if ('node' === args.environment) {
      newScript += ''
        + '\n  factory.__pakmanager_factory__ = true;'
        + '\n  provide("' + module.modulepath + '", factory);'
        ;
      } else {
      newScript += ''
        + '\n  provide("' + module.modulepath + '", module.exports);'
        ;   
      }

      if (module.modulepath !== module.providespath) {
        newScript += '\n  provide("' + module.providespath + '", module.exports);';
      }

      // TODO has ender bridge or something like that
      if ('browser' === args.environment && pkg && (pkg.ender || (pkg.keywords && -1 !== pkg.keywords.indexOf('ender')))) {
        newScript += '\n  $.ender(module.exports);';
      }

      //console.log('modulepath:', module.modulepath);
      //console.log('module keys:', Object.keys(module));
      //console.log('module package:', pkg);

      newScript += '\n}(global));';

      return newScript;
    }



    if (args.environment === 'node') {
      builtIns = nodeNatives;
    } else {
      builtIns = browserNatives;
    }
    console.log(args);
    console.log('builtIns');

    pakman.compile(args.packageRoot, builtIns, templateModule, function (err, compiled) {

      fs.writeFile(path.join(args.packageRoot, 'pakmanaged.js'), ''
        //+ '(function () {\n'
        + 'var global = Function("return this;")();\n'
        // force users of the framework to use require rather than globals
        //+ 'var window, navigator, location, FormData, File, localStorage;\n'
        + loaderScript 
        + compiled
        + '\nrequire("pakmanager.main");'
        //+ '}());\n'
      , 'utf8');
      /*
      fs.writeFile(path.join(packageRoot, 'pakmanaged.html'), ''
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
      */
      //console.warn('[WARN] iHeartTheBadParts (non-strict mode) on by default\n');
      //console.log('wrote pakmanaged.js and pakmanaged.html');
      console.log('wrote pakmanaged.js');
    });
  };

  //pakman.makePackageReady(packageRoot, displayResults);
}());
