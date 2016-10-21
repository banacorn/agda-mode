"use strict";
var Promise = require('bluebird');
var temp = require('temp');
var AgdaMode = require('../../agda-mode');
AgdaMode; // a dummy refernce here so that the module will be imported
var chai = require('chai');
require('mocha');
require('chai-as-promised');
// import 'chai-things';
chai.should();
chai.use(require('chai-as-promised'));
// chai.use(require('chai-things'))
// Automatically track and cleanup files at exit
temp.track();
// opens a new Agda file, and returns correspoding TextEditor
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
    // temporary directory
    var directory = null;
    // activate language-agda before everything
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
                // get the element of the editor so that we could dispatch commands
                var element = atom.views.getView(editor);
                atom.commands.dispatch(element, 'agda-mode:load');
                // wait after it's activated
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
                // get the element of the editor so that we could dispatch commands
                var element = atom.views.getView(editor);
                atom.commands.dispatch(element, 'agda-mode:load');
                // wait after it's activated
                activationPromise.then(function () {
                    getActivePackageNames().should.contain('agda-mode');
                    editor.should.have.property('core');
                    close(editor);
                    done();
                });
            });
        });
        // it('should be activated after triggering agda-mode:input-symbol on .agda files', (done) => {
        //     open({dir: directory, suffix: '.agda'})
        //         .then((editor) => {
        //             // get the element of the editor so that we could dispatch commands
        //             const element = atom.views.getView(editor)
        //             atom.commands.dispatch(element, 'agda-mode:input-symbol');
        //             // wait after it's activated
        //             activationPromise.then(() => {
        //                 getActivePackageNames().should.contain('agda-mode');
        //                 editor.should.have.property('core');
        //                 close(editor)
        //                 done();
        //             });
        //         });
        // });
        // it('should be activated after triggering agda-mode:input-symbol on .lagda files', (done) => {
        //     open({dir: directory, suffix: '.lagda'})
        //         .then((editor) => {
        //             // get the element of the editor so that we could dispatch commands
        //             const element = atom.views.getView(editor)
        //             atom.commands.dispatch(element, 'agda-mode:input');
        //             // wait after it's activated
        //             activationPromise.then(() => {
        //                 getActivePackageNames().should.contain('agda-mode');
        //                 editor.should.have.property('core');
        //                 close(editor)
        //                 done();
        //             });
        //         });
        // });
    });
});
// describe('Spawn a group of files', () => {
//     // temporary directory
//     const directory = null;
//
//     // options for different types of files
//     const agdaFile = {dir: directory, suffix: '.agda'};
//     const lagdaFile = {dir: directory, suffix: '.lagda'};
//     const otherFile = {dir: directory, suffix: '.others'};
//
//     let tempAgdaFile = null;
//
//     describe('loading language-agda', () => {
//         it('should be loaded', (done) => {
//             atom.packages.activatePackage('language-agda').then(() => {
//                 getLoadedPackageNames().should.contain('language-agda');
//                 done()
//             });
//         });
//     });
//
//     describe('before activating agda-mode', () => {
//
//         it('should not be activated before triggering events', () => {
//             getActivePackageNames().should.not.contain('agda-mode');
//             open(agdaFile)
//                 .then((editor) => {
//                     editor.should.not.have.property('core');
//                     close(editor);
//                 });
//         });
//
//     });
//
//     describe('activating agda-mode', () => {
//
//         let activationPromise;
//
//         beforeEach(() => {
//             if (_.includes(getActivePackageNames(), 'agda-mode'))
//                 atom.packages.deactivatePackage('agda-mode');
//             activationPromise = atom.packages.activatePackage('agda-mode');
//             return
//         });
//
//         it('should be activated after triggering "agda-mode:load" in .agda files', (done) => {
//             open(agdaFile)
//                 .then((editor) => {
//                     // get the element of the editor so that we could dispatch commands
//                     const element = atom.views.getView(editor)
//                     atom.commands.dispatch(element, 'agda-mode:load');
//                     // wait after it's activated
//                     activationPromise.then(() => {
//                         getActivePackageNames().should.contain('agda-mode');
//                         editor.should.have.property('core');
//                         close(editor)
//                         done();
//                     });
//                 });
//         });
//
//         it('should be activated after triggering "agda-mode:load" in .lagda files', (done) => {
//
//             open(lagdaFile)
//                 .then((editor) => {
//                     // get the element of the editor so that we could dispatch commands
//                     const element = atom.views.getView(editor)
//                     atom.commands.dispatch(element, 'agda-mode:load');
//                     // wait after it's activated
//                     activationPromise.then(() => {
//                         getActivePackageNames().should.contain('agda-mode');
//                         editor.should.have.property('core');
//                         close(editor);
//                         done();
//                     });
//                 });
//         });
//
//         // it('should be activated after triggering "agda-mode:input-symbol" in .agda files', (done) => {
//         //     open(agdaFile)
//         //         .then((editor) => {
//         //             // get the element of the editor so that we could dispatch commands
//         //             const element = atom.views.getView(editor)
//         //             atom.commands.dispatch(element, 'agda-mode:input-symbol');
//         //             // wait after it's activated
//         //             activationPromise.then(() => {
//         //                 getActivePackageNames().should.contain('agda-mode');
//         //                 editor.should.have.property('core');
//         //                 close(editor)
//         //                 done();
//         //             });
//         //         });
//         // });
//
//         // it('should be activated after triggering "agda-mode:input-symbol" in .lagda files', (done) => {
//         //
//         //     open(lagdaFile)
//         //         .then((editor) => {
//         //             // get the element of the editor so that we could dispatch commands
//         //             const element = atom.views.getView(editor)
//         //             atom.commands.dispatch(element, 'agda-mode:input-symbol');
//         //             // wait after it's activated
//         //             activationPromise.then(() => {
//         //                 getActivePackageNames().should.contain('agda-mode');
//         //                 editor.should.have.property('core');
//         //                 close(editor);
//         //                 done();
//         //             });
//         //         });
//         // });
//     });
//
// });
//# sourceMappingURL=activation.js.map