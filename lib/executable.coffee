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
    #
    # data IOTCM = IOTCM FilePath HighlightingLevel HighlightingMethod (Interaction' range)
    # data HighlightingLevel = None | NonInteractive | Interactive
    # data HighlightingMethod = Direct | Indirect
    #
    # data Range a = Range [Interval' a]
    # data Interval a = Interval { iStart, iEnd :: !(Position' a) }
    # data Position a = Pn a !Int32 !Int32 !Int32
    #
    # ################

    buildRange: (goal) ->
        start       = goal.range.start
        startIndex  = @core.editor.toIndex start
        end         = goal.range.end
        endIndex    = @core.editor.toIndex end
        "( Range [Interval
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
            ])"

    sendCommand: (highlightingLevel, interaction) ->
        @getProcess().then (process) =>
            filepath = @core.filepath
            highlightingMethod = @core.config.directHighlighting()
            command = "IOTCM \"#{filepath}\" #{highlightingLevel} #{highlightingMethod} ( #{interaction} )\n"
            console.log command
            process.stdin.write command
            return process

    load: ->
        # force save before load, since we are sending filepath but content
        @core.textBuffer.saveBuffer()
        @sendCommand "NonInteractive", "Cmd_load \"#{@core.filepath}\" [#{@core.config.libraryPath()}]"

    quit: ->
        @process.kill()
        @processWired = false
        log 'Executable', 'process killed'

    compile: ->
        @sendCommand "NonInteractive", "Cmd_compile MAlonzo \"#{@core.filepath}\" [#{@core.config.libraryPath()}]"
    toggleDisplayOfImplicitArguments: ->
        @sendCommand "NonInteractive", "ToggleImplicitArgs"
    showConstraints: ->
        @sendCommand "NonInteractive", "Cmd_constraints"
    showGoals: ->
        @sendCommand "NonInteractive", "Cmd_metas"
    inferType: (content) ->
        @sendCommand "None", "Cmd_infer_toplevel Simplified \"#{content}\""
    inferTypeGoalSpecific: (goal, content) ->
        @sendCommand "NonInteractive", "Cmd_infer Simplified #{goal.index} noRange \"#{content}\""
    inferTypeNormalized: (content) ->
        @sendCommand "None", "Cmd_infer_toplevel Instantiated \"#{content}\""
    inferTypeNormalizedGoalSpecific: (goal, content) ->
        @sendCommand "NonInteractive", "Cmd_infer Instantiated #{goal.index} noRange \"#{content}\""
    moduleContents: (content) ->
        @sendCommand "None", "Cmd_show_module_contents_toplevel Simplified \"#{content}\""
    moduleContentsGoalSpecific: (goal, content) ->
        @sendCommand "NonInteractive", "Cmd_show_module_contents Simplified #{goal.index} noRange \"#{content}\""
    computeNormalForm: (content) ->
        @sendCommand "None", "Cmd_compute_toplevel False \"#{content}\""
    computeNormalFormGoalSpecific: (goal, content) ->
        @sendCommand "NonInteractive", "Cmd_compute False #{goal.index} noRange \"#{content}\""
    computeNormalFormIgnoreAbstract: (content) ->
        @sendCommand "None", "Cmd_compute_toplevel True \"#{content}\""
    computeNormalFormIgnoreAbstractGoalSpecific: (goal, content) ->
        @sendCommand "NonInteractive", "Cmd_compute True #{goal.index} noRange \"#{content}\""

    give: (goal) ->
        @sendCommand "NonInteractive", "Cmd_give #{goal.index} #{@buildRange goal} \"#{escape goal.getContent()}\""

    refine: (goal) ->
        @sendCommand "NonInteractive", "Cmd_refine_or_intro False #{goal.index} #{@buildRange goal} \"#{escape goal.getContent()}\""

    auto: (goal) ->
        @sendCommand "NonInteractive", "Cmd_auto #{goal.index} #{@buildRange goal} \"#{escape goal.getContent()}\""

    case: (goal) ->
        @sendCommand "NonInteractive", "Cmd_make_case #{goal.index} #{@buildRange goal} \"#{escape goal.getContent()}\""

    goalType: (normalize, goal) ->
        normalize = if normalize then 'Simplified' else 'Instantiated'
        @sendCommand "NonInteractive", "Cmd_goal_type #{normalize} #{goal.index} noRange \"\""

    context: (normalize, goal) ->
        normalize = if normalize then 'Simplified' else 'Instantiated'
        @sendCommand "NonInteractive", "Cmd_context #{normalize} #{goal.index} noRange \"\""

    goalTypeAndContext: (normalize, goal) ->
        normalize = if normalize then 'Simplified' else 'Instantiated'
        @sendCommand "NonInteractive", "Cmd_goal_type_context #{normalize} #{goal.index} noRange \"\""

    goalTypeAndInferredType: (normalize, goal) ->
        normalize = if normalize then 'Simplified' else 'Instantiated'
        content = escape goal.getContent()
        if content
            @sendCommand "NonInteractive", "Cmd_goal_type_context_infer #{normalize} #{goal.index} noRange \"#{content}\""

module.exports = Executable
