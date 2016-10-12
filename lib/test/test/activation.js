"use strict";
var Promise = require('bluebird');
var temp = require('temp');
var AgdaMode = require('../../agda-mode');
AgdaMode;
var chai = require('chai');
require('mocha');
require('chai-as-promised');
chai.should();
chai.use(require('chai-as-promised'));
temp.track();
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
            openFile(agdaFD).should.eventually.not.have.property('core');
            openFile(lagdaFD).should.eventually.not.have.property('core');
            openFile(potatoFD).should.eventually.not.have.property('core');
        });
    });
    describe('activating agda-mode', function () {
        var activationPromise;
        beforeEach(function () {
            atom.packages.deactivatePackage('agda-mode');
            activationPromise = atom.packages.activatePackage('agda-mode');
            return;
        });
        it('should be activated after triggering "agda-mode:load" in .agda files', function (done) {
            openFile(agdaFD)
                .then(function (textEditor) {
                var element = atom.views.getView(textEditor);
                atom.commands.dispatch(element, 'agda-mode:load');
                activationPromise.then(function () {
                    getActivePackageNames().should.contain('agda-mode');
                    textEditor.should.have.property('core');
                    done();
                });
            });
        });
    });
});
//# sourceMappingURL=activation.js.map