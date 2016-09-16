"use strict";
var Promise = require('bluebird');
var temp = require('temp');
var chai = require('chai');
require('mocha');
require('chai-as-promised');
chai.should();
chai.use(require('chai-as-promised'));
temp.track();
console.log('loading language-agda');
var openFile = function (options) { return new Promise(function (resolve, reject) {
    temp.open(options, function (error, info) {
        atom.workspace.open(info.path).then(resolve).catch(reject);
    });
}); };
var getActivePackageNames = function () { return atom.packages.getActivePackages().map(function (o) { return o.name; }); };
var getLoadedPackageNames = function () { return atom.packages.getLoadedPackages().map(function (o) { return o.name; }); };
describe('Spawn a group of files', function () {
    var directory = null;
    var _a = [null, null, null], agdaFD = _a[0], lagdaFD = _a[1], potatoFD = _a[2];
    atom.packages.activatePackage('agda-mode');
    agdaFD = { dir: directory, suffix: '.agda' };
    lagdaFD = { dir: directory, suffix: '.lagda' };
    potatoFD = { dir: directory, suffix: '.potato' };
    describe('loading language-agda', function () {
        it('should be loaded', function (done) {
            atom.packages.activatePackage('language-agda').then(function () {
                getLoadedPackageNames().should.contain('language-agda');
                done();
            });
        });
    });
    describe('before activating agda-mode', function () {
        it('should not be activated before triggering events', function () {
            getActivePackageNames().should.not.contain('agda-mode');
        });
        it('should not have property `core` before activation', function () {
            openFile(agdaFD).should.eventually.not.have.property('core');
            openFile(lagdaFD).should.eventually.not.have.property('core');
            openFile(potatoFD).should.eventually.not.have.property('core');
        });
    });
    describe('activating language-agda', function () {
        beforeEach(function () {
            console.log('%cfuck', 'color: red');
            atom.packages.deactivatePackage('agda-mode');
            atom.packages.activatePackage('agda-mode');
            return;
        });
        it('should be activated after triggering "agda-mode:load" in .agda files', function (done) {
            var editor;
            openFile(agdaFD)
                .then(function (textEditor) {
                var element = atom.views.getView(textEditor);
                atom.commands.dispatch(element, 'agda-mode:load');
                editor = textEditor;
                return atom.packages.activatePackage('agda-mode');
            })
                .then(function () {
                getActivePackageNames().should.contain('agda-mode');
                console.log(editor.core);
                done();
            });
        });
    });
});
//# sourceMappingURL=activation.js.map