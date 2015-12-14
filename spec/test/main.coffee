{expect} = require 'chai'
{Promise} = require 'bluebird'
path = require 'path'
fs = require 'fs'
temp = require 'temp'

AgdaMode = require '../lib/agda-mode'

# Automatically track and cleanup files at exit
temp.track()

# opens a new Agda file, and returns correspoding TextEditor
openFile = (options) -> new Promise (resolve, reject) ->
    temp.open options, (error, info) ->
        atom.workspace.open(info.path).then(resolve).catch(reject)

getActivePackageNames = -> atom.packages.getActivePackages().map((o) -> o.name)
getLoadedPackageNames = -> atom.packages.getLoadedPackages().map((o) -> o.name)

describe 'Spawn a group of files', ->

    directory = null
    [agdaFD, lagdaFD, potatoFD] = []

    before ->
        # temporary directory
        directory = temp.mkdirSync()
        atom.project.setPaths [directory]

        # console.log "disable: #{atom.packages.isPackageDisabled('agda-mode')}"
        # console.log "loaded: #{atom.packages.isPackageLoaded('agda-mode')}"
        # console.log "active: #{atom.packages.isPackageActive('agda-mode')}"

        # somehow we have to keep this line although it makes no sense
        atom.packages.activatePackage('agda-mode')

        # spawn files
        agdaFD = {dir: directory, suffix: '.agda'}
        lagdaFD = {dir: directory, suffix: '.lagda'}
        potatoFD = {dir: directory, suffix: '.potato'}

    describe 'loading language-agda', ->
        it 'should be loaded', (done) ->
            atom.packages.activatePackage('language-agda').then ->
                loadedPackages = getLoadedPackageNames()
                expect(loadedPackages).to.contain 'language-agda'
                done()

    describe 'before activating agda-mode', ->

        it 'should not be activated before triggering events', ->
            activePackages = getActivePackageNames()
            expect(activePackages).to.not.contain 'agda-mode'

    describe 'activating agda-mode', ->

        beforeEach ->
            atom.packages.deactivatePackage('agda-mode')
            atom.packages.activatePackage('agda-mode')
            return

        it 'should be activated after triggering "agda-mode:load" in .agda files', (done) ->

            openFile agdaFD
                .then (textEditor) ->
                    element = atom.views.getView(textEditor)
                    atom.commands.dispatch(element, 'agda-mode:load')
                    return atom.packages.activatePackage('agda-mode')
                .then ->
                    activePackages = getActivePackageNames()
                    expect(activePackages).to.contain 'agda-mode'
                    done()


        it 'should be activated after triggering "agda-mode:load" in .lagda files', (done) ->

            openFile lagdaFD
                .then (textEditor) ->
                    element = atom.views.getView(textEditor)
                    atom.commands.dispatch(element, 'agda-mode:load')
                    return atom.packages.activatePackage('agda-mode')
                .then ->
                    activePackages = getActivePackageNames()
                    expect(activePackages).to.contain 'agda-mode'
                    done()
