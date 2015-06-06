{EventEmitter} = require 'events'
{spawn, exec} = require 'child_process'
Q = require 'q'
Q.longStackSupport = true
{log, warn, error} = require './logger'


Stream = require './executable/stream'

escape = (content) ->
    content
        .replace(/\n/g, '\\n')
        .replace(/\"/g, '\\"')

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
        @core.panelModel.set 'Agda executable not found', [], 'warning'
        @core.panelModel.placeholder = 'path of executable here'
        @core.panelModel.query()
            .then (path) =>
                log 'Executable', "got path: #{path}"
                @validateExecutablePath path
            .then (path) =>
                log 'Executable', "path validated: #{path}"
                atom.config.set 'agda-mode.executablePath', path
                return path
            .fail =>
                warn 'Executable', "path failed"
                @queryExecutablePathUntilSuccess()

    # get executable path from config, query the user if failed
    getExecutablePath: ->
        path = @core.config.executablePath()
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
                    .pipe new Stream.ParseSExpr
                    .pipe new Stream.ParseCommand @
                log 'Executable', 'process.stdout stream established'


    ################
    #   COMMANDS   #
    ################

    load: -> @getProcess().then (process) =>
        # force save before load, since we are sending filepath not content
        @core.textBuffer.saveBuffer()
        command = "IOTCM
                \"#{@core.filepath}\"
                NonInteractive
                #{@core.config.directHighlighting()}
                ( Cmd_load
                    \"#{@core.filepath}\"
                    [#{@core.config.libraryPath()}])\n"
        process.stdin.write command

        return process

    quit: ->
        @process.kill()
        @processWired = false
        log 'Executable', 'process killed'

    compile: -> @getProcess().then (process) =>
        command = "IOTCM
                \"#{@core.filepath}\"
                NonInteractive
                #{@core.config.directHighlighting()}
                ( Cmd_compile
                    MAlonzo
                    \"#{@core.filepath}\"
                    [#{@core.config.libraryPath()}])\n"
        process.stdin.write command

    toggleDisplayOfImplicitArguments: -> @getProcess().then (process) =>
        command = "IOTCM \"#{@core.filepath}\" NonInteractive #{@core.config.directHighlighting()} ( ToggleImplicitArgs )\n"
        process.stdin.write command

    showConstraints: -> @getProcess().then (process) =>
        command = "IOTCM \"#{@core.filepath}\" NonInteractive #{@core.config.directHighlighting()} ( Cmd_constraints )\n"
        process.stdin.write command

    showGoals: -> @getProcess().then (process) =>
        command = "IOTCM \"#{@core.filepath}\" NonInteractive #{@core.config.directHighlighting()} ( Cmd_metas )\n"
        process.stdin.write command

    inferType: (content) -> @getProcess().then (process) =>
        command = "IOTCM \"#{@core.filepath}\" None #{@core.config.directHighlighting()} ( Cmd_infer_toplevel Simplified \"#{content}\" )\n"
        process.stdin.write command

    inferTypeNormalized: (content) -> @getProcess().then (process) =>
        command = "IOTCM \"#{@core.filepath}\" None #{@core.config.directHighlighting()} ( Cmd_infer_toplevel Instantiated \"#{content}\" )\n"
        process.stdin.write command

    give: (goal) -> @getProcess().then (process) =>
        goalIndex   = goal.index
        start       = goal.range.start
        startIndex  = goal.toIndex start
        end         = goal.range.end
        endIndex    = goal.toIndex end
        content     = escape goal.getContent()

        if content
            command = "IOTCM
                \"#{@core.filepath}\"
                NonInteractive
                #{@core.config.directHighlighting()}
                ( Cmd_give
                    #{goalIndex}
                    ( Range [Interval
                        (Pn
                            (Just (mkAbsolute \"#{@core.filepath}\"))
                            #{startIndex}
                            #{start.row + 1}
                            #{start.column + 1})
                        (Pn
                            (Just (mkAbsolute \"#{@core.filepath}\"))
                            #{endIndex}
                            #{end.row + 1}
                            #{end.column + 1})
                        ])
                    \"#{content}\" )\n"
            process.stdin.write command

    goalType: (goal) -> @getProcess().then (process) =>
        index = goal.index
        command = "IOTCM \"#{@core.filepath}\" NonInteractive #{@core.config.directHighlighting()} ( Cmd_goal_type Simplified #{index} noRange \"\" )\n"
        process.stdin.write command

    context: (goal) -> @getProcess().then (process) =>
        index = goal.index
        command = "IOTCM \"#{@core.filepath}\" NonInteractive #{@core.config.directHighlighting()} ( Cmd_context Simplified #{index} noRange \"\" )\n"
        process.stdin.write command

    goalTypeAndContext: (goal) -> @getProcess().then (process) =>
        goalIndex = goal.index
        command = "IOTCM \"#{@core.filepath}\" NonInteractive #{@core.config.directHighlighting()} ( Cmd_goal_type_context Simplified #{goalIndex} noRange \"\" )\n"
        process.stdin.write command

    goalTypeAndInferredType: (goal) -> @getProcess().then (process) =>
        goalIndex = goal.index
        content = escape goal.getContent()
        if content
            command = "IOTCM \"#{@core.filepath}\" NonInteractive #{@core.config.directHighlighting()} ( Cmd_goal_type_context_infer Simplified #{goalIndex} noRange \"#{content}\" )\n"
            process.stdin.write command

    refine: (goal) -> @getProcess().then (process) =>
        goalIndex = goal.index
        start = goal.range.start
        startIndex = goal.toIndex start
        end = goal.range.end
        endIndex = goal.toIndex end
        content = escape goal.getContent()
        command = "IOTCM \"#{@core.filepath}\" NonInteractive #{@core.config.directHighlighting()}
          ( Cmd_refine_or_intro False #{goalIndex} (Range [Interval (Pn (Just
           (mkAbsolute \"#{@core.filepath}\")) #{startIndex} #{start.row + 1} #{start.column + 1})
           (Pn (Just (mkAbsolute \"#{@core.filepath}\")) #{endIndex} #{end.row + 1}
            #{end.column + 1})]) \"#{content}\" )\n"
        process.stdin.write command

    case: (goal) -> @getProcess().then (process) =>
        goalIndex = goal.index
        start = goal.range.start
        startIndex = goal.toIndex start
        end = goal.range.end
        endIndex = goal.toIndex end
        content = escape goal.getContent()
        command = "IOTCM \"#{@core.filepath}\" NonInteractive #{@core.config.directHighlighting()}
            ( Cmd_make_case #{goalIndex} (Range [Interval (Pn (Just
            (mkAbsolute \"#{@core.filepath}\")) #{startIndex} #{start.row + 1} #{start.column + 1})
            (Pn (Just (mkAbsolute \"#{@core.filepath}\")) #{endIndex} #{end.row + 1}
             #{end.column + 1})]) \"#{content}\" )\n"
        process.stdin.write command

    auto: (goal) -> @getProcess().then (process) =>
        goalIndex = goal.index
        start = goal.range.start
        startIndex = goal.toIndex start
        end = goal.range.end
        endIndex = goal.toIndex end
        content = escape goal.getContent()
        command = "IOTCM \"#{@core.filepath}\" NonInteractive #{@core.config.directHighlighting()}
            ( Cmd_auto #{goalIndex} (Range [Interval (Pn (Just
            (mkAbsolute \"#{@core.filepath}\")) #{startIndex} #{start.row + 1} #{start.column + 1})
            (Pn (Just (mkAbsolute \"#{@core.filepath}\")) #{endIndex} #{end.row + 1}
             #{end.column + 1})]) \"#{content}\" )\n"
        process.stdin.write command

    normalize: (content) -> @getProcess().then (process) =>
        command = "IOTCM \"#{@core.filepath}\" None #{@core.config.directHighlighting()} ( Cmd_compute_toplevel False \"#{content}\" )\n"
        process.stdin.write command


module.exports = Executable
