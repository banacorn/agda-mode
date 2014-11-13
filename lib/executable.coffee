{EventEmitter} = require 'events'
{spawn, exec} = require 'child_process'
Q = require 'Q'
{log, warn, error} = require './logger'


Stream = require './executable/stream'

escape = (content) -> content.replace(/\n/g, '\\n')

class Executable extends EventEmitter

    # instance wired the agda-mode executable
    processWired: false
    process: null

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
        view = @core.panel.queryExecutablePath()
        view.promise
            .then (path) =>
                log 'Executable', "got path: #{path}"
                @validateExecutablePath path
            .then (path) =>
                log 'Executable', "path validated: #{path}"
                atom.config.set 'agda-mode.executablePath', path
                path
            .fail        =>
                warn 'Executable', "path failed: #{path}"
                @queryExecutablePathUntilSuccess()

    # get executable path from config, query the user if failed
    getExecutablePath: ->
        path = atom.config.get 'agda-mode.executablePath'
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

                log 'Executable', 'process wired'

                process.stdout
                    .pipe new Stream.Rectify
                    # .pipe new Stream.Log
                    .pipe new Stream.Preprocess
                    .pipe new Stream.ParseSExpr
                    .pipe new Stream.ParseCommand @
                log 'Executable', 'process.stdout stream established'


    ################
    #   COMMANDS   #
    ################

    load: -> @getProcess().then (process) =>
        includeDir = atom.config.get 'agda-mode.libraryPath'

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

    quit: ->
        @process.kill()
        @processWired = false
        log 'Executable', 'process killed'

    give: (goal) -> @getProcess().then (process) =>
        goalIndex   = goal.index
        start       = goal.getStart()
        startIndex  = goal.toIndex start
        end         = goal.getEnd()
        endIndex    = goal.toIndex end
        content     = escape goal.getContent()

        command = "IOTCM
            \"#{@core.filePath}\"
            NonInteractive
            Indirect
            ( Cmd_give
                #{goalIndex}
                ( Range [Interval
                    (Pn
                        (Just (mkAbsolute \"#{@core.filePath}\"))
                        #{startIndex}
                        #{start.row + 1}
                        #{start.column + 1})
                    (Pn
                        (Just (mkAbsolute \"#{@core.filePath}\"))
                        #{endIndex}
                        #{end.row + 1}
                        #{end.column + 1})
                    ])
                \"#{content}\" )\n"

        process.stdin.write command

    goalType: (goal) -> @getProcess().then (process) =>
        index = goal.index
        command = "IOTCM
            \"#{@core.filePath}\"
            NonInteractive
            Indirect
            ( Cmd_goal_type Simplified
                #{index}
                noRange
                \"\" )\n"

        process.stdin.write command

    context: (goal) -> @getProcess().then (process) =>
        index = goal.index
        command = "IOTCM
            \"#{@core.filePath}\"
            NonInteractive
            Indirect
            ( Cmd_context Simplified
                #{index}
                noRange
                \"\" )\n"

        process.stdin.write command

module.exports = Executable
