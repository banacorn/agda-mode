const { createRunner } = require('atom-mocha-test-runner')
var Mocha = require('mocha')
import * as path from 'path';

// optional options to customize the runner
const extraOptions = {
    testSuffixes: ['n.js']
}

console.log("FUCK!!!!!!!!")
const optionalConfigurationFunction = function (mocha) {

    const testPath = path.join(__dirname, 'test');
    console.log(testPath)
    // using Mocha programatically
    Mocha.utils
        .lookupFiles(testPath, ['js'], true)
        .forEach(mocha.addFile.bind(mocha))

    // run!
    // const runner = mocha.run();
    return mocha
}

module.exports = createRunner(extraOptions, optionalConfigurationFunction);
