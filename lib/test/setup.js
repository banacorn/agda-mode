"use strict";
// courtesy of @jccguimaraes, https://gist.github.com/jccguimaraes/2e08be6f549448d9361c
var path = require('path');
// import * as Mocha from 'mocha';
var Promise = require('bluebird');
var Mocha = require('mocha');
module.exports = function (args) {
    var promise = new Promise(function (resolve, reject) {
        // constructs a headless Atom
        window['atom'] = args.buildAtomEnvironment({
            applicationDelegate: args.buildDefaultApplicationDelegate(),
            window: window,
            document: document,
            configDirPath: process.env.ATOM_HOME,
            enablePersistence: false
        });
        console.log(args.testPaths);
        var testPath = path.join(args.testPaths[0], 'test');
        // using Mocha programatically
        var mocha = new Mocha;
        Mocha.utils
            .lookupFiles(testPath, ['coffee'], true)
            .forEach(mocha.addFile.bind(mocha));
        // run!
        var runner = mocha.run(function (failure) {
            resolve(failure);
        });
    });
    // catch and report errors occured in test scripts!
    promise.catch(function (error) {
        // `error` is an instance of `Error`
        console.dir(error);
        // I don't know if there's other way to tell whether the spec was
        // invoked from the editor, or ran in console, but ::isMaximized() seems do just fine
        if (window['atom'].isMaximized()) {
        }
        else {
            // spec probably runs in console
            process.exit(1); // do something to quit the process, or it HANGS!
        }
    });
    return promise;
};
//# sourceMappingURL=setup.js.map