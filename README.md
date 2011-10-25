pakmanager
===

An example (and fully functional) package manager built on the `pakman` and `npm` APIs.

Installation
===

If you haven't already set your NPM author info, now you should:

    npm set init.author.name "Your Name"
    npm set init.author.email "you@example.com"
    npm set init.author.url "http://yourblog.com"

    npm adduser

And install pakmanager:

    npm install -g pakmanager

Usage
===

In short: run `pakmanager build` wherever `package.json` exists

Create your project

    PROJECT=~/Code/some-project
    mkdir -p ${PROJECT}/lib
    cd ${PROJECT}
    touch lib/index.js
    npm init

Mark as private if need be by editing `package.json` and adding `"private": true,`

Test and build your module

    pakmanager deps
    pakmanager build
    # edit pakmanaged-test.js
    # open pakmanaged.html to see about any errors

And you might want to publish your module

    npm publish ./


CLI / API
===

    pakmanager deps       # list all dependencies
    pakmanager build      # builds package.json.browserDependencies and package.json.main

    rm -rf pakmanaged.js ./node_modules # clean old builds

TODO
===

    pakmanager init       # creates / updates package.json
    pakmanager install    # installs package.json.browserDependencies into ./node_modules
    pakmanager clean      # rm -rf ./node_modules
    pakmanager rebuild    # clean, build
