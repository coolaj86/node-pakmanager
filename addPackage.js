  var fs = require('fs');

  function addDeps(names) {
    var pkg 
      , deps
      ;

    try {
      pkg = JSON.parse(fs.readFileSync('package.json'));
    } catch(e) {
      pkg = {
          name: __dirname.split('/').pop()
        , version: '0.1.0'
        , dependencies: {}
        , browserDependencies: {}
        , devDependencies: {}
      }
    }

    deps = pkg.browserDependencies = pkg.browserDependencies || {}

    if (!names.length) {
      return
    }

    names.forEach(function (name) {
      var nameParts
        , version
        ;

      nameParts = name.split('@')
      version = nameParts.pop()
      // strictly speaking, `@' shouldn't be allowed in a name
      // but no harm in allowing it if it is there I supposed
      name = nameParts.join('@')

      if (deps[name] && !version) {
        return;
      }

      deps[name] = version || '*';
    });

    fs.writeFileSync('package.json', JSON.stringify(pkg, null, '  '), 'utf8');
  }

  addDep(['futures@ ~v 0.1']);
