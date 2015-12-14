# courtesy of @jccguimaraes, https://gist.github.com/jccguimaraes/2e08be6f549448d9361c
path    = require 'path'
Mocha   = require 'mocha'

module.exports = (args) ->
    promise = new Promise (resolve, reject) ->

        # build a headless Atom
        window.atom = args.buildAtomEnvironment
            applicationDelegate: args.buildDefaultApplicationDelegate()
            window: window
            document: document
            configDirPath: process.env.ATOM_HOME
            enablePersistence: false
        testPath = path.join args.testPaths[0], 'test'

        # using Mocha programatically
        mocha = new Mocha
        Mocha.utils
            .lookupFiles(testPath, ['coffee'], true)
            .forEach mocha.addFile.bind(mocha)

        # run!
        runner = mocha.run (failure) ->
            resolve failure

    # catch and report errors occured in test scripts!
    promise.catch (error) ->
        # `error` is an instance of `Error`
        console.dir error

        # I don't know if there's other way to tell whether the spec was
        # invoked from the editor, or ran in console, but ::isMaximized() seems do just fine
        if window.atom.isMaximized()
            # spec probably invoked in editor
            # window.atom.close() # close the spec runner if you like
        else
            # spec probably runs in console
            process.exit 1 # do something to quit the process, or it HANGS!

    return promise


        # creating report
        # element = document.createElement('div')
        # element.id = 'mocha'
        # document.body.appendChild element

        # allowUnsafeNewFunction ->
            # testPath = path.join args.testPaths[0], 'test'
            # srcPath = path.join args.testPaths[0], '..', 'test'

            # mocha = new Mocha().reporter('landing');
            # Mocha.utils
            #     .lookupFiles(testPath, ['coffee'], true)
            #     .forEach mocha.addFile.bind(mocha)
            # mocha.run().on 'end', ->
            #     console.log 'end'
            #     {Instrumenter, Report, Collector} = require 'istanbul'
            #     instrumenter = new Instrumenter
            #     reporters = ['html']
            #     collector = new Collector
            #     srcFiles = getAllFiles srcPath
            #
            #     srcFiles.forEach (file) ->
            #         content = fs.readFileSync file, 'utf8'
            #         instrumenter.instrumentSync content, file
            #         coverageCode = instrumenter.lastFileCoverage()
            #         coverage = {}
            #         coverage[coverageCode.path] = coverageCode
            #         collector.add coverage
            #
            #     reporters.forEach (reporter) ->
            #         allowUnsafeNewFunction ->
            #             Report
            #                 .create(reporter, dir: path.join(__dirname, '../coverage', reporter))
            #                 .writeReport(collector, true)
            #
            # link = document.createElement 'link'
            # link.setAttribute 'rel', 'stylesheet'
            # link.setAttribute 'href', path.join(__dirname, '..', 'node_modules/mocha/mocha.css')
            # document.head.appendChild link
            # document.body.style.overflow = 'scroll'
