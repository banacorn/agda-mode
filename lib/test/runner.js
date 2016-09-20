"use strict";
var createRunner = require('atom-mocha-test-runner').createRunner;
var Mocha = require('mocha');
var path = require('path');
// optional options to customize the runner
var extraOptions = {
    testSuffixes: ['n.js']
};
console.log("FUCK!!!!!!!!");
var optionalConfigurationFunction = function (mocha) {
    var testPath = path.join(__dirname, 'test');
    console.log(testPath);
    // using Mocha programatically
    Mocha.utils
        .lookupFiles(testPath, ['js'], true)
        .forEach(mocha.addFile.bind(mocha));
    // run!
    // const runner = mocha.run();
    return mocha;
};
module.exports = createRunner(extraOptions, optionalConfigurationFunction);
//# sourceMappingURL=runner.js.map