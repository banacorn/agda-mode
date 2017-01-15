"use strict";
const Promise = require("bluebird");
const temp = require("temp");
const AgdaMode = require("../../agda-mode");
AgdaMode; // a dummy refernce here so that the module will be imported
const chai = require("chai");
require("mocha");
require("chai-as-promised");
// import 'chai-things';
chai.should();
chai.use(require('chai-as-promised'));
// chai.use(require('chai-things'))
// Automatically track and cleanup files at exit
temp.track();
// opens a new Agda file, and returns correspoding TextEditor
const open = (options) => new Promise((resolve, reject) => {
    temp.open(options, (error, info) => {
        atom.workspace.open(info.path).then(resolve).catch(reject);
    });
});
const close = (editor) => {
    const pane = atom.workspace.paneForItem(editor);
    if (pane)
        pane.destroyItem(editor);
};
const getActivePackageNames = () => atom.packages.getActivePackages().map((o) => o.name);
const getLoadedPackageNames = () => atom.packages.getLoadedPackages().map((o) => o.name);
describe('Acitvation', () => {
    // temporary directory
    const directory = null;
    // activate language-agda before everything
    before(() => {
        return atom.packages.activatePackage('language-agda');
    });
    describe('activating agda-mode', () => {
        let activationPromise;
        beforeEach(() => {
            activationPromise = atom.packages.activatePackage('agda-mode');
        });
        afterEach(() => {
            atom.packages.deactivatePackage('agda-mode');
        });
        it('should be activated after triggering agda-mode:load on .agda files', (done) => {
            open({ dir: directory, suffix: '.agda' })
                .then((editor) => {
                // get the element of the editor so that we could dispatch commands
                const element = atom.views.getView(editor);
                atom.commands.dispatch(element, 'agda-mode:load');
                // wait after it's activated
                activationPromise.then(() => {
                    getActivePackageNames().should.contain('agda-mode');
                    editor.should.have.property('core');
                    close(editor);
                    done();
                });
            });
        });
        it('should be activated after triggering agda-mode:load on .lagda files', (done) => {
            open({ dir: directory, suffix: '.lagda' })
                .then((editor) => {
                // get the element of the editor so that we could dispatch commands
                const element = atom.views.getView(editor);
                atom.commands.dispatch(element, 'agda-mode:load');
                // wait after it's activated
                activationPromise.then(() => {
                    getActivePackageNames().should.contain('agda-mode');
                    editor.should.have.property('core');
                    close(editor);
                    done();
                });
            });
        });
        it('should be activated after triggering agda-mode:input-symbol on .agda files', (done) => {
            open({ dir: directory, suffix: '.agda' })
                .then((editor) => {
                // get the element of the editor so that we could dispatch commands
                const element = atom.views.getView(editor);
                atom.commands.dispatch(element, 'agda-mode:input-symbol');
                // wait after it's activated
                activationPromise.then(() => {
                    getActivePackageNames().should.contain('agda-mode');
                    editor.should.have.property('core');
                    editor.save();
                    close(editor);
                    done();
                });
            });
        });
        it('should be activated after triggering agda-mode:input-symbol on .lagda files', (done) => {
            open({ dir: directory, suffix: '.lagda' })
                .then((editor) => {
                // get the element of the editor so that we could dispatch commands
                const element = atom.views.getView(editor);
                atom.commands.dispatch(element, 'agda-mode:input-symbol');
                // wait after it's activated
                activationPromise.then(() => {
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