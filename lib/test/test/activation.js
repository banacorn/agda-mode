"use strict";
var Promise = require("bluebird");
var temp = require("temp");
var AgdaMode = require("../../agda-mode");
AgdaMode;
var chai = require("chai");
require("mocha");
require("chai-as-promised");
chai.should();
chai.use(require('chai-as-promised'));
temp.track();
var open = function (options) { return new Promise(function (resolve, reject) {
    temp.open(options, function (error, info) {
        atom.workspace.open(info.path).then(resolve).catch(reject);
    });
}); };
var close = function (editor) {
    var pane = atom.workspace.paneForItem(editor);
    if (pane)
        pane.destroyItem(editor);
};
var getActivePackageNames = function () { return atom.packages.getActivePackages().map(function (o) { return o.name; }); };
var getLoadedPackageNames = function () { return atom.packages.getLoadedPackages().map(function (o) { return o.name; }); };
describe('Acitvation', function () {
    var directory = null;
    before(function () {
        return atom.packages.activatePackage('language-agda');
    });
    describe('activating agda-mode', function () {
        var activationPromise;
        beforeEach(function () {
            activationPromise = atom.packages.activatePackage('agda-mode');
        });
        afterEach(function () {
            atom.packages.deactivatePackage('agda-mode');
        });
        it('should be activated after triggering agda-mode:load on .agda files', function (done) {
            open({ dir: directory, suffix: '.agda' })
                .then(function (editor) {
                var element = atom.views.getView(editor);
                atom.commands.dispatch(element, 'agda-mode:load');
                activationPromise.then(function () {
                    getActivePackageNames().should.contain('agda-mode');
                    editor.should.have.property('core');
                    close(editor);
                    done();
                });
            });
        });
        it('should be activated after triggering agda-mode:load on .lagda files', function (done) {
            open({ dir: directory, suffix: '.lagda' })
                .then(function (editor) {
                var element = atom.views.getView(editor);
                atom.commands.dispatch(element, 'agda-mode:load');
                activationPromise.then(function () {
                    getActivePackageNames().should.contain('agda-mode');
                    editor.should.have.property('core');
                    close(editor);
                    done();
                });
            });
        });
        it('should be activated after triggering agda-mode:input-symbol on .agda files', function (done) {
            open({ dir: directory, suffix: '.agda' })
                .then(function (editor) {
                var element = atom.views.getView(editor);
                atom.commands.dispatch(element, 'agda-mode:input-symbol');
                activationPromise.then(function () {
                    getActivePackageNames().should.contain('agda-mode');
                    editor.should.have.property('core');
                    editor.save();
                    close(editor);
                    done();
                });
            });
        });
        it('should be activated after triggering agda-mode:input-symbol on .lagda files', function (done) {
            open({ dir: directory, suffix: '.lagda' })
                .then(function (editor) {
                var element = atom.views.getView(editor);
                atom.commands.dispatch(element, 'agda-mode:input-symbol');
                activationPromise.then(function () {
                    getActivePackageNames().should.contain('agda-mode');
                    editor.should.have.property('core');
                    editor.save();
                    close(editor);
                    done();
                });
            });
        });
    });
});
//# sourceMappingURL=activation.js.map