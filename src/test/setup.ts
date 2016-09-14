// courtesy of @jccguimaraes, https://gist.github.com/jccguimaraes/2e08be6f549448d9361c
import * as path from 'path';
// import * as Mocha from 'mocha';
import * as Promise from 'bluebird';
var Mocha = require('mocha')


module.exports = function(args) {
    const promise = new Promise((resolve, reject) => {
        // constructs a headless Atom
        window['atom'] = args.buildAtomEnvironment({
            applicationDelegate: args.buildDefaultApplicationDelegate(),
            window: window,
            document: document,
            configDirPath: process.env.ATOM_HOME,
            enablePersistence: false
        });
        console.log(args.testPaths)
        const testPath = path.join(args.testPaths[0], 'test');

        // using Mocha programatically
        const mocha = new Mocha;
        Mocha.utils
            .lookupFiles(testPath, ['coffee'], true)
            .forEach(mocha.addFile.bind(mocha))

        // run!
        const runner = mocha.run((failure) => {
            resolve(failure)
        });
    });

    // catch and report errors occured in test scripts!
    promise.catch((error) => {
        // `error` is an instance of `Error`
        console.dir(error)

        // I don't know if there's other way to tell whether the spec was
        // invoked from the editor, or ran in console, but ::isMaximized() seems do just fine
        if (window['atom'].isMaximized()) {
            // spec probably invoked in editor
            // window.atom.close() # close the spec runner if you like
        } else {
            // spec probably runs in console
            process.exit(1) // do something to quit the process, or it HANGS!
        }
    })
    return promise
}
