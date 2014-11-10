{EventEmitter} = require 'events'
{spawn, exec} = require 'child_process'
Q = require 'Q'
{log, warn, error} = require './logger'


Stream = require './executable/stream'

class Executable extends EventEmitter

    # instance wired the agda-mode executable
    processWired: false
    process: null

    constructor: (@core) ->

        @getProcess().then (process) =>
            process.stdout
                .pipe new Stream.Rectify
                # .pipe new Stream.Log
                .pipe new Stream.Preprocess
                .pipe new Stream.ParseSExpr
                .pipe new Stream.ParseCommand @
            log 'Executable', 'process.stdout stream established'

    # locate the path and see if it is Agda executable
    validateExecutablePath: (path) -> Q.Promise (resolve, reject, notify) =>
        command = path + ' -V'
        exec command, (error, stdout, stderr) =>
            if /^Agda version/.test stdout
                resolve path
            else
                reject error if error
                reject stderr if stderr

    # keep banging the user until we got the right path
    queryExecutablePathUntilSuccess: ->
        view = @core.panel.queryExecutablePath()
        view.promise
            .then (path) =>
                log 'Executable', "got path: #{path}"
                @validateExecutablePath path
            .then (path) =>
                log 'Executable', "path validated: #{path}"
                atom.config.set 'agda-mode.agdaExecutablePath', path
                path
            .fail        =>
                warn 'Executable', "path failed: #{path}"
                @queryExecutablePathUntilSuccess()

    # get executable path from config, query the user if failed
    getExecutablePath: ->
        path = atom.config.get 'agda-mode.agdaExecutablePath'
        @validateExecutablePath path
            .then (path) => path
            .fail        => @queryExecutablePathUntilSuccess()

    getProcess: -> Q.Promise (resolve, reject, notify) =>
        if @processWired
            resolve @process
        else
            @getExecutablePath().then (path) =>
                process = spawn path, ['--interaction']

                # catch other forms of errors
                process.on 'error', (error) =>
                    reject error

                # see if it is really agda
                process.stdout.once 'data', (data) =>
                  if /^Agda2/.test data
                    @processWired = true
                    @process = process
                    resolve process

    ################
    #   COMMANDS   #
    ################

    load: -> @getProcess().then (process) =>
        includeDir = atom.config.get 'agda-mode.agdaLibraryPath'

        if includeDir
            command = "IOTCM
                \"#{@core.filePath}\"
                NonInteractive
                Indirect
                ( Cmd_load
                    \"#{@core.filePath}\"
                    [\".\", \"#{includeDir}\"])\n"
            process.stdin.write command
        else
            command = "IOTCM
                \"#{@core.filePath}\"
                NonInteractive
                Indirect
                ( Cmd_load
                    \"#{@core.filePath}\"
                    [])\n"
            process.stdin.write command

        return process

module.exports = Executable
