{EventEmitter} = require 'events'
{spawn, exec} = require 'child_process'
Q = require 'Q'


class Executable extends EventEmitter

    # instance wired the agda-mode executable
    agdaProcessWired: false
    agdaProcess: null

    constructor: (@core) ->

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
        view = new @core.panel.queryExecutablePath
        view.promise
            .then (path) => @validateExecutablePath path
            .then (path) =>
                atom.config.set 'agda-mode.agdaExecutablePath', path
                path
            .fail        => @queryExecutablePathUntilSuccess()

    # get executable path from config, query the user if failed
    getExecutablePath: ->
        path = atom.config.get 'agda-mode.agdaExecutablePath'
        @validateExecutablePath path
            .then (path) => path
            .fail        => @queryExecutablePathUntilSuccess()

    getAgdaProcess: -> Q.Promise (resolve, reject, notify) =>
        if @agdaProcessWired
            resolve @agdaProcess
        else
            @getExecutablePath().then (path) =>
                process = spawn path, ['--interaction']

                # catch other forms of errors
                process.on 'error', (error) =>
                    reject error

                # see if it is really agda
                process.stdout.once 'data', (data) =>
                  if /^Agda2/.test data
                    @agdaProcessWired = true
                    @agdaProcess = process
                    resolve process

    ################
    #   COMMANDS   #
    ################

    load: -> @getAgdaProcess().then (process) =>
        command = "IOTCM \"#{@core.filePath}\"
            NonInteractive
            Indirect
            ( Cmd_load \"#{@core.filePath}\" [])\n"
        process.stdin.write command

module.exports = Executable
