/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var fs = require('fs')
    , semver = require('semver')
    , forEachAsync = require('forEachAsync')
    , npm = require('npm')
    , reNoMaxVer = /^\s*>=?\s*[^<>=\s]+\s*$/
    ;

  function prettyVer(ver) {
    return semver.validRange(ver).replace(/-\s+/g, ' ').replace(/-$/, '') || '*';
  }

  function fixDeps(deps) {
    var depsObj = {}
      ;

    if (!Array.isArray(deps)) {
      if ('object' === typeof deps) {
        return deps;
      }

      console.error('dependencies or browserDependencies was neither array nor object:');
      console.error(deps);
      console.error('Replacing with empty object: {}');
      return {};
    }

    deps.forEach(function (dep) {
      var depParts = dep.split('@')
        ;

      depsObj[depParts[0]] = prettyVer(depParts[1]);
    });

    return depsObj;
  }

  function promoteVersion(ver) {
    var vers = semver.parse(ver)
      ;

    if (Number(vers[1])) {
      return '>=' + ver + ' <' + (Number(vers[1]) + 1);
    }

    if (Number(vers[2])) {
      return '>=' + ver + ' < 0.' + (Number(vers[2]) + 1);
    }

    return  '=0.0.' + vers[3];
  }

  // prefer cli value over package.json value
  // add max if not present
  function getSafeVer(orig, current) {
    var name = orig.split('@').shift()
      , origVer = orig.split('@').pop()
      , curVer = current.split('@').pop()
      , version
      ;

    if (origVer) {
      version = origVer;
    } else {
      version = curVer;
    }

    version = version.replace(/v/g, '');

    // find >= without 
    if (reNoMaxVer.test(version)) {
      version = curVer.replace(/>=?/g, ' '); 
      return prettyVer(promoteVersion(version));
    }

    // already has more than one
    // TODO might be max-only (no min)
    if (/[~<>]=?/.test(version)) {
      return prettyVer(version);
    }
    
    if ('*' === version) {
      version = curVer;
    }
    return prettyVer('~' + (curVer));
  }

  function installEach(next, nameAndVer) {
    /*jshint validthis:true*/
    var deps = this
      ;

    //npm.commands.view([nameAndVer], function (err, mapByVersion) {
    npm.commands.install([nameAndVer], function (err, arr, obj, str) {
      var pkgName = nameAndVer.split('@').shift().trim()
        , safeVer
        , installed
        , installedDetails
        ;

      if (err) {
        console.error(err);
        return;
      }

      arr.some(function (details) {
        if (details[0].match(pkgName)) {
          installed = details[0];
          return true;
        }
      });
      Object.keys(obj).some(function (dir) {
        if (installed === obj[dir].what) {
          installedDetails = obj[dir];
          return true;
        }
      });

      if (!installedDetails) {
        console.error(pkgName, installed, obj);
      }

      safeVer = getSafeVer(nameAndVer, installedDetails.what);
      deps[pkgName] = safeVer;

      next();
    });
  }

  function addDeps(names) {
    var pkg 
      , deps
      ;

    // fix unsafe version schemes
    function addLaxVersions(name) {
      var version = deps[name]
        ;

      delete deps[name];
      name = name.trim();
      version = version.trim();
      deps[name] = version;

      // fix invalid versions (including *)
      if ('*' === version || !semver.validRange(version)) {
        console.error('invalid version for', name, '@', version, 'assuming ', name, '@ *');
        version = '';
      }

      // fix any >= entries without <
      if (!version || reNoMaxVer.test(version)) {
        console.error('bad version:', name, version);
        // avoid duplicates
        if (names.every(function (_name) {
          return name.trim() !== _name.trim();
        })) {
          if (version) {
            names.push(name + '@' + prettyVer(version));
          } else {
            names.push(name);
          }
        }
      }
    }

    try {
      pkg = JSON.parse(fs.readFileSync('package.json'));
    } catch(e) {
      pkg = {
          name: __dirname.split('/').pop()
        , version: '0.1.0'
        , maintainers: []
        , dependencies: {}
        , devDependencies: {}
      };
      console.error(e);
    }

    if (pkg.dependencies) {
      deps = pkg.dependencies = fixDeps(pkg.dependencies);
    } else if (pkg.browserDependencies) {
      deps = pkg.browserDependencies = fixDeps(pkg.browserDependencies);
    } else {
      deps = pkg.dependencies = {};
    }

    Object.keys(deps).forEach(addLaxVersions);
    names.forEach(function (nameAndVer, i) {
      var parts = nameAndVer.split('@')
        , name = parts.shift()
        , ver = prettyVer(parts.pop() || '*')
        ;

      names[i] = name.trim() + '@' + ver.trim();
    });

    forEachAsync(names, installEach, deps).then(function () {
      fs.writeFile('package.json', JSON.stringify(pkg, null, '  '), 'utf8', function (err) {
        if (err) {
          console.error(err);
        }

        console.log(deps);
      });
    });
  }

  function onNpmReady() {
    var pkgs = Array.prototype.splice.call(process.argv, 2)
      ;

    if (pkgs.length < 2) {
      pkgs.push('futures@ ~v1.9');
      pkgs.push('sequence @ 2.x');
    }

    addDeps(pkgs);
  }

  npm.load({ loglevel: 'silent' }, onNpmReady);
}());
