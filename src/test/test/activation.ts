import * as Promise from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';
import * as temp from 'temp';

import * as AgdaMode from '../../agda-mode';
declare var atom: any;

import * as chai from 'chai';
import 'mocha';
import 'chai-as-promised';
// import 'chai-things';
chai.should();
chai.use(require('chai-as-promised'));
// chai.use(require('chai-things'))

// Automatically track and cleanup files at exit
temp.track()

// opens a new Agda file, and returns correspoding TextEditor
const openFile = (options) => new Promise((resolve, reject) => {
    temp.open(options, (error, info) => {
        atom.workspace.open(info.path).then(resolve).catch(reject)
    })
});

const getActivePackageNames = () => atom.packages.getActivePackages().map((o) => o.name)
const getLoadedPackageNames = () => atom.packages.getLoadedPackages().map((o) => o.name)

describe('Spawn a group of files', () => {
    // temporary directory
    const directory = null;
    let [agdaFD, lagdaFD, potatoFD] = [null, null, null];

    // somehow we have to keep this line although it makes no sense
    atom.packages.activatePackage('agda-mode')

    // spawn files
    agdaFD = {dir: directory, suffix: '.agda'}
    lagdaFD = {dir: directory, suffix: '.lagda'}
    potatoFD = {dir: directory, suffix: '.potato'}

    describe('loading language-agda', () => {
        it('should be loaded', (done) => {
            atom.packages.activatePackage('language-agda').then(() => {
                getLoadedPackageNames().should.contain('language-agda');
                done()
            });
        });
    });

    describe('before activating agda-mode', () => {
        it('should not be activated before triggering events', () => {
            getActivePackageNames().should.not.contain('agda-mode');
        });
        it('should not have property `core` before activation', () => {
            openFile(agdaFD).should.eventually.not.have.property('core');
            openFile(lagdaFD).should.eventually.not.have.property('core');
            openFile(potatoFD).should.eventually.not.have.property('core');
        });
    });

    describe('activating language-agda', () => {

        // let textEditor_ = null;

        beforeEach(() => {
            atom.packages.deactivatePackage('agda-mode');
            atom.packages.activatePackage('agda-mode');
            return
        });

        it('should be activated after triggering "agda-mode:load" in .agda files', (done) => {
            let editor;
            openFile(agdaFD)
                .then((textEditor) => {
                    const element = atom.views.getView(textEditor)
                    atom.commands.dispatch(element, 'agda-mode:load')
                    editor = textEditor;
                    return atom.packages.activatePackage('agda-mode')
                })
                .then(() => {
                    getActivePackageNames().should.contain('agda-mode');
                    // console.log(editor.core)
                    done();
                })
        });
    });

});
